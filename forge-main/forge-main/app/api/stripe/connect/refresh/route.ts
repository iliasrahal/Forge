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

    const link = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${base}/api/stripe/connect/refresh`,
      return_url: `${base}/api/stripe/connect/return`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(link.url);
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.redirect(`${base}/login`);
    }
    console.error("STRIPE CONNECT REFRESH ERROR", error);
    return NextResponse.redirect(`${base}/settings/paiement`);
  }
}
