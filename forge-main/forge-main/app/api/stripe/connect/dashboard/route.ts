import { NextResponse } from "next/server";

import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { appUrl, getStripe, isStripeConfigured } from "@/src/lib/stripe";

export async function GET() {
  const base = appUrl();
  try {
    const context = await requireWorkspaceContext("write");
    const accountId = context.workspace.stripeAccountId;

    if (!isStripeConfigured() || !accountId) {
      return NextResponse.redirect(`${base}/settings/paiement`);
    }

    const loginLink = await getStripe().accounts.createLoginLink(accountId);
    return NextResponse.redirect(loginLink.url);
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.redirect(`${base}/login`);
    }
    console.error("STRIPE CONNECT DASHBOARD ERROR", error);
    return NextResponse.redirect(`${base}/settings/paiement`);
  }
}
