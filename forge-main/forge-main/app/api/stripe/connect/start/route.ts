import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { appUrl, getStripe, isStripeConfigured } from "@/src/lib/stripe";

export async function POST() {
  try {
    const currentUser = await requireCurrentUser();
    const context = await requireWorkspaceContext("write");

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Les paiements en ligne ne sont pas encore configurés." },
        { status: 503 },
      );
    }

    if (!context.subscription.hasAccess) {
      return NextResponse.json(
        {
          error:
            "Les paiements en ligne sont réservés aux formules payantes.",
        },
        { status: 403 },
      );
    }

    if (context.membership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Seul le propriétaire peut connecter un compte de paiement." },
        { status: 403 },
      );
    }

    const stripe = getStripe();
    const organization = context.workspace;
    let accountId = organization.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: currentUser.email,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
          // Virement SEPA (customer_balance) côté facture publique.
          sepa_bank_transfer_payments: { requested: true },
        },
        business_profile: {
          name: organization.name,
        },
        metadata: { organizationId: organization.id },
      });
      accountId = account.id;
      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeAccountId: accountId },
      });
    }

    const base = appUrl();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/api/stripe/connect/refresh`,
      return_url: `${base}/api/stripe/connect/return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("STRIPE CONNECT START ERROR", error);
    return NextResponse.json(
      { error: "Impossible de démarrer la configuration Stripe." },
      { status: 500 },
    );
  }
}
