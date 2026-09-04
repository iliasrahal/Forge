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

type EnsureConnectAccountClient = {
  organization: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (args: any) => Promise<any>;
  };
};

/**
 * Crée le compte Connect Express de l'organisation s'il n'existe pas encore
 * et renvoie son id. Idempotent : ne recrée rien si `stripeAccountId` est
 * déjà posé.
 */
export async function ensureConnectAccount(
  client: EnsureConnectAccountClient,
  organization: { id: string; name: string; stripeAccountId: string | null },
  ownerEmail: string,
): Promise<string> {
  if (organization.stripeAccountId) return organization.stripeAccountId;

  const account = await getStripe().accounts.create({
    type: "express",
    country: "FR",
    email: ownerEmail,
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

  await client.organization.update({
    where: { id: organization.id },
    data: { stripeAccountId: account.id },
  });

  return account.id;
}
