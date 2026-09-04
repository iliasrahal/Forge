import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/src/lib/prisma";
import { appUrl, getStripe, isStripeConfigured } from "@/src/lib/stripe";
import { getPublicInvoiceByToken } from "@/src/lib/public-invoice";
import { computeInvoicePaymentState } from "@/src/lib/payments";
import { isValidClientEmail, normalizeClientEmail } from "@/src/lib/client-email";

type CheckoutRouteProps = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, { params }: CheckoutRouteProps) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Le paiement en ligne n’est pas disponible." },
        { status: 503 },
      );
    }

    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const method = body.method === "bank_transfer" ? "bank_transfer" : "card";

    const access = await getPublicInvoiceByToken(token);
    if (!access) {
      return NextResponse.json(
        { error: "Ce lien de paiement n’est plus valide." },
        { status: 404 },
      );
    }

    const { invoice } = access;
    const org = invoice.organization;

    if (
      invoice.status === "BROUILLON" ||
      invoice.status === "ANNULEE" ||
      invoice.status === "PAYEE"
    ) {
      return NextResponse.json(
        { error: "Cette facture n’est pas payable en ligne." },
        { status: 409 },
      );
    }

    if (!org?.stripeAccountId || !org.stripeChargesEnabled) {
      return NextResponse.json(
        {
          error:
            "L’artisan n’a pas encore activé le paiement en ligne pour cette facture.",
        },
        { status: 409 },
      );
    }

    const state = computeInvoicePaymentState(
      invoice.amountCents,
      invoice.payments,
    );
    if (state.remainingCents <= 0) {
      return NextResponse.json(
        { error: "Cette facture est déjà réglée." },
        { status: 409 },
      );
    }

    const amountCents = state.remainingCents;
    const stripe = getStripe();
    const accountId = org.stripeAccountId;
    const base = appUrl();

    const clientEmail = isValidClientEmail(access.invoice.client.email)
      ? normalizeClientEmail(access.invoice.client.email)
      : null;
    const clientName =
      access.invoice.client.type === "PROFESSIONNEL"
        ? access.invoice.client.companyName || "Client"
        : `${access.invoice.client.firstName ?? ""} ${
            access.invoice.client.lastName ?? ""
          }`.trim() || "Client";

    // Nettoie les tentatives précédentes jamais allées au bout (session
    // Checkout créée puis abandonnée avant confirmation par Stripe) pour ne
    // pas accumuler des lignes PENDING fantômes à chaque nouvel essai.
    await prisma.payment.updateMany({
      where: {
        invoiceId: invoice.id,
        provider: "STRIPE",
        status: "PENDING",
        stripePaymentIntentId: null,
      },
      data: { status: "CANCELED" },
    });

    const created = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        organizationId: org.id,
        amountCents,
        currency: "eur",
        status: "PENDING",
        provider: "STRIPE",
        method,
      },
    });

    const successUrl = `${base}/facture/${token}?paid=1`;
    const cancelUrl = `${base}/facture/${token}?canceled=1`;
    const productName = `Facture ${invoice.reference}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: invoice.id,
      metadata: { paymentId: created.id, invoiceId: invoice.id },
      payment_intent_data: {
        description: productName,
        metadata: { paymentId: created.id, invoiceId: invoice.id },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: { name: productName },
          },
        },
      ],
    };

    if (method === "bank_transfer") {
      const customer = await stripe.customers.create(
        {
          email: clientEmail ?? undefined,
          name: clientName,
          metadata: { invoiceId: invoice.id },
        },
        { stripeAccount: accountId },
      );
      sessionParams.customer = customer.id;
      sessionParams.payment_method_types = ["customer_balance"];
      sessionParams.payment_method_options = {
        customer_balance: {
          funding_type: "bank_transfer",
          bank_transfer: {
            type: "eu_bank_transfer",
            eu_bank_transfer: { country: "FR" },
          },
        },
      };
    } else {
      sessionParams.payment_method_types = ["card"];
      if (clientEmail) sessionParams.customer_email = clientEmail;
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams, {
        stripeAccount: accountId,
      });
    } catch (stripeError) {
      await prisma.payment.delete({ where: { id: created.id } });
      console.error("STRIPE CHECKOUT CREATE ERROR", stripeError);
      return NextResponse.json(
        {
          error:
            method === "bank_transfer"
              ? "Le paiement par virement n’est pas encore activé sur ce compte."
              : "Le paiement par carte est momentanément indisponible.",
        },
        { status: 502 },
      );
    }

    await prisma.payment.update({
      where: { id: created.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("PUBLIC INVOICE CHECKOUT ERROR", error);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement." },
      { status: 500 },
    );
  }
}
