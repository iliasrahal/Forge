import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { getStripe, isStripeConfigured } from "@/src/lib/stripe";
import { ensureConnectAccount } from "@/src/lib/stripe-connect";

/**
 * Session Connect embarquée : couvre à la fois l'onboarding et la gestion
 * du compte, affichés dans /settings/paiement sans jamais rediriger vers
 * connect.stripe.com.
 */
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

    const accountId = await ensureConnectAccount(
      prisma,
      context.workspace,
      currentUser.email,
    );

    const accountSession = await getStripe().accountSessions.create({
      account: accountId,
      components: {
        account_onboarding: { enabled: true },
        account_management: { enabled: true },
      },
    });

    return NextResponse.json({ clientSecret: accountSession.client_secret });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("STRIPE CONNECT EMBEDDED SESSION ERROR", error);
    return NextResponse.json(
      { error: "Impossible de démarrer la configuration Stripe." },
      { status: 500 },
    );
  }
}
