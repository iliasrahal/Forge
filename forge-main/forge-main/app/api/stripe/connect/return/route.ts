import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { appUrl, isStripeConfigured } from "@/src/lib/stripe";
import { refreshConnectAccount } from "@/src/lib/stripe-connect";

export async function GET() {
  const base = appUrl();
  try {
    const context = await requireWorkspaceContext("read");

    if (isStripeConfigured() && context.workspace.stripeAccountId) {
      try {
        await refreshConnectAccount(
          prisma,
          context.workspace.id,
          context.workspace.stripeAccountId,
        );
      } catch (syncError) {
        console.error("STRIPE CONNECT RETURN SYNC ERROR", syncError);
      }
    }

    return NextResponse.redirect(`${base}/settings/paiement`);
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.redirect(`${base}/login`);
    }
    console.error("STRIPE CONNECT RETURN ERROR", error);
    return NextResponse.redirect(`${base}/settings/paiement`);
  }
}
