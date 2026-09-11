import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { getStripe, isStripeConfigured } from "@/src/lib/stripe";
import { syncInvoicePaymentStatus } from "@/src/lib/invoice-payment-sync";
import { revalidateStatusViews } from "@/src/lib/status-revalidation";
import { syncConnectAccount } from "@/src/lib/stripe-connect";

// Les webhooks Stripe exigent le corps brut pour vérifier la signature.
export const dynamic = "force-dynamic";

/** Récupère les frais réels d'un paiement depuis sa transaction de balance. */
async function readIntentFees(
  paymentIntentId: string,
  connectedAccountId: string | null,
): Promise<{ feeCents: number; netCents: number } | null> {
  try {
    const options = connectedAccountId
      ? { stripeAccount: connectedAccountId }
      : undefined;
    const intent = await getStripe().paymentIntents.retrieve(
      paymentIntentId,
      { expand: ["latest_charge.balance_transaction"] },
      options,
    );
    const charge = intent.latest_charge;
    if (!charge || typeof charge === "string") return null;
    const balanceTransaction = charge.balance_transaction;
    if (!balanceTransaction || typeof balanceTransaction === "string") {
      return null;
    }
    return {
      feeCents: balanceTransaction.fee ?? 0,
      netCents: balanceTransaction.net ?? 0,
    };
  } catch (error) {
    console.error("STRIPE FEE LOOKUP ERROR", error);
    return null;
  }
}

async function finalizeSucceeded(
  paymentId: string,
  invoiceId: string,
  paymentIntentId: string | null,
  connectedAccountId: string | null,
  existingPaidAt: Date | null,
) {
  const fees = paymentIntentId
    ? await readIntentFees(paymentIntentId, connectedAccountId)
    : null;

  await prisma.$transaction(async (transaction) => {
    await transaction.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCEEDED",
        // Une relivraison Stripe ne doit pas déplacer la date d'encaissement.
        paidAt: existingPaidAt ?? new Date(),
        errorMessage: null,
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
        ...(fees
          ? { feeCents: fees.feeCents, netCents: fees.netCents }
          : {}),
      },
    });

    // Paiement et statut de facture forment une seule écriture atomique.
    await syncInvoicePaymentStatus(transaction, invoiceId);
  });
}

function isDuplicateEventError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook Stripe non configuré." },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature absente." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("STRIPE WEBHOOK SIGNATURE ERROR", error);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  // Idempotence : un event.id déjà vu est ignoré.
  try {
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        accountId: event.account ?? null,
      },
    });
  } catch (error) {
    if (isDuplicateEventError(error)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("STRIPE WEBHOOK IDEMPOTENCE ERROR", event.type, error);
    return NextResponse.json(
      { error: "Enregistrement du webhook impossible." },
      { status: 500 },
    );
  }

  const connectedAccountId = event.account ?? null;
  const affectedInvoiceIds = new Set<string>();

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { stripeCheckoutSessionId: session.id },
              ...(session.metadata?.paymentId
                ? [{ id: session.metadata.paymentId }]
                : []),
            ],
          },
        });
        if (!payment) break;
        affectedInvoiceIds.add(payment.invoiceId);

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        if (
          session.payment_status === "paid" ||
          event.type === "checkout.session.async_payment_succeeded"
        ) {
          await finalizeSucceeded(
            payment.id,
            payment.invoiceId,
            paymentIntentId,
            connectedAccountId,
            payment.paidAt,
          );
        } else if (paymentIntentId) {
          // Virement bancaire : fonds pas encore reçus, on garde le lien.
          await prisma.payment.update({
            where: { id: payment.id },
            data: { stripePaymentIntentId: paymentIntentId },
          });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { stripePaymentIntentId: intent.id },
              ...(intent.metadata?.paymentId
                ? [{ id: intent.metadata.paymentId }]
                : []),
            ],
          },
        });
        if (!payment) break;
        affectedInvoiceIds.add(payment.invoiceId);
        // Même déjà SUCCEEDED, on resynchronise la facture : cela répare une
        // éventuelle ancienne exécution interrompue entre les deux écritures.
        await finalizeSucceeded(
          payment.id,
          payment.invoiceId,
          intent.id,
          connectedAccountId,
          payment.paidAt,
        );
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { stripeCheckoutSessionId: session.id },
              ...(session.metadata?.paymentId
                ? [{ id: session.metadata.paymentId }]
                : []),
            ],
          },
        });
        if (!payment) break;
        affectedInvoiceIds.add(payment.invoiceId);
        if (payment.status === "SUCCEEDED" || payment.status === "REFUNDED") {
          await syncInvoicePaymentStatus(prisma, payment.invoiceId);
          break;
        }
        await prisma.$transaction(async (transaction) => {
          await transaction.payment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              errorMessage: "Le paiement différé a échoué.",
            },
          });
          await syncInvoicePaymentStatus(transaction, payment.invoiceId);
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { stripePaymentIntentId: intent.id },
              ...(intent.metadata?.paymentId
                ? [{ id: intent.metadata.paymentId }]
                : []),
            ],
          },
        });
        if (!payment) break;
        affectedInvoiceIds.add(payment.invoiceId);
        // Un événement d'échec livré tardivement ne peut pas annuler un
        // encaissement déjà confirmé ou remboursé.
        if (payment.status === "SUCCEEDED" || payment.status === "REFUNDED") {
          await syncInvoicePaymentStatus(prisma, payment.invoiceId);
          break;
        }
        await prisma.$transaction(async (transaction) => {
          await transaction.payment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              errorMessage:
                intent.last_payment_error?.message ?? "Paiement refusé.",
            },
          });
          await syncInvoicePaymentStatus(transaction, payment.invoiceId);
        });
        break;
      }

      case "payment_intent.canceled": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { stripePaymentIntentId: intent.id },
              ...(intent.metadata?.paymentId
                ? [{ id: intent.metadata.paymentId }]
                : []),
            ],
          },
        });
        if (!payment) break;
        affectedInvoiceIds.add(payment.invoiceId);
        if (payment.status === "SUCCEEDED" || payment.status === "REFUNDED") {
          await syncInvoicePaymentStatus(prisma, payment.invoiceId);
          break;
        }
        await prisma.$transaction(async (transaction) => {
          await transaction.payment.update({
            where: { id: payment.id },
            data: {
              status: "CANCELED",
              errorMessage: "Paiement annulé.",
            },
          });
          await syncInvoicePaymentStatus(transaction, payment.invoiceId);
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : (charge.payment_intent?.id ?? null);
        if (!paymentIntentId) break;
        const payment = await prisma.payment.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        });
        if (!payment) break;
        affectedInvoiceIds.add(payment.invoiceId);
        await prisma.$transaction(async (transaction) => {
          await transaction.payment.update({
            where: { id: payment.id },
            data: {
              refundedCents: charge.amount_refunded ?? 0,
              status: charge.refunded ? "REFUNDED" : "SUCCEEDED",
            },
          });
          await syncInvoicePaymentStatus(transaction, payment.invoiceId);
        });
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const organization = await prisma.organization.findFirst({
          where: { stripeAccountId: account.id },
          select: { id: true },
        });
        if (!organization) break;
        await syncConnectAccount(prisma, organization.id, account);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("STRIPE WEBHOOK HANDLER ERROR", event.type, error);
    // L'événement ne doit rester marqué comme traité que si tout son handler
    // a réussi. Sa suppression permet à Stripe de le relivrer sans perdre la
    // synchronisation du paiement ou de la facture.
    try {
      await prisma.stripeEvent.delete({ where: { id: event.id } });
    } catch (cleanupError) {
      console.error("STRIPE WEBHOOK RETRY CLEANUP ERROR", event.id, cleanupError);
    }
    return NextResponse.json(
      { error: "Traitement du webhook impossible." },
      { status: 500 },
    );
  }

  for (const invoiceId of affectedInvoiceIds) {
    revalidateStatusViews("invoice", invoiceId);
  }

  return NextResponse.json({ received: true });
}
