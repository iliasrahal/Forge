import type Stripe from "stripe";

import { getStripe } from "@/src/lib/stripe";

type OrgConnectClient = {
  organization: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (args: any) => Promise<any>;
  };
};

export type ConnectStatus =
  | "none"
  | "pending"
  | "restricted"
  | "active";

export function connectStatusFromFlags(flags: {
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripeDetailsSubmitted: boolean;
}): ConnectStatus {
  if (!flags.stripeAccountId) return "none";
  if (flags.stripeChargesEnabled) return "active";
  if (flags.stripeDetailsSubmitted) return "restricted";
  return "pending";
}

/**
 * Reporte l'état d'un compte Stripe Connect sur l'organisation. Idempotent :
 * appelé au retour d'onboarding comme sur l'événement `account.updated`.
 */
export async function syncConnectAccount(
  client: OrgConnectClient,
  organizationId: string,
  account: Stripe.Account,
) {
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);

  await client.organization.update({
    where: { id: organizationId },
    data: {
      stripeChargesEnabled: chargesEnabled,
      stripePayoutsEnabled: payoutsEnabled,
      stripeDetailsSubmitted: detailsSubmitted,
      stripeOnboardedAt:
        chargesEnabled && detailsSubmitted ? new Date() : null,
    },
  });

  return { chargesEnabled, payoutsEnabled, detailsSubmitted };
}

/** Récupère le compte Connect depuis Stripe et reporte son état. */
export async function refreshConnectAccount(
  client: OrgConnectClient,
  organizationId: string,
  stripeAccountId: string,
) {
  const account = await getStripe().accounts.retrieve(stripeAccountId);
  return syncConnectAccount(client, organizationId, account);
}
