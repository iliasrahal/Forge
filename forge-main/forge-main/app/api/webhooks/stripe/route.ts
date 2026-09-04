import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/src/lib/prisma";
import { getStripe, isStripeConfigured } from "@/src/lib/stripe";
import { syncInvoicePaymentStatus } from "@/src/lib/invoice-payment-sync";
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
) {
  const fees = paymentIntentId
    ? await readIntentFees(paymentIntentId, connectedAccountId)
    : null;

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "SUCCEEDED",
      paidAt: new Date(),
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
      ...(fees
        ? { feeCents: fees.feeCents, netCents: fees.netCents }
        : {}),
    },
  });

  await syncInvoicePaymentStatus(prisma, invoiceId);
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
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const connectedAccountId = event.account ?? null;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
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

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        if (session.payment_status === "paid") {
          await finalizeSucceeded(
            payment.id,
            payment.invoiceId,
            paymentIntentId,
            connectedAccountId,
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
        if (!payment || payment.status === "SUCCEEDED") break;
        await finalizeSucceeded(
          payment.id,
          payment.invoiceId,
          intent.id,
          connectedAccountId,
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const payment = await prisma.payment.findFirst({
          where: { stripePaymentIntentId: intent.id },
        });
        if (!payment) break;
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            errorMessage:
              intent.last_payment_error?.message ?? "Paiement refusé.",
          },
        });
        await syncInvoicePaymentStatus(prisma, payment.invoiceId);
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
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            refundedCents: charge.amount_refunded ?? 0,
            status: charge.refunded ? "REFUNDED" : "SUCCEEDED",
          },
        });
        await syncInvoicePaymentStatus(prisma, payment.invoiceId);
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
    return NextResponse.json(
      { error: "Traitement du webhook impossible." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
