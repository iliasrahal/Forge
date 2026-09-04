import Link from "next/link";

import ConnectPaymentsCard from "@/components/ConnectPaymentsCard";
import { requireCurrentUser } from "@/src/lib/auth";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { isStripeConfigured } from "@/src/lib/stripe";
import { connectStatusFromFlags } from "@/src/lib/stripe-connect";

export default async function PaiementSettingsPage() {
  await requireCurrentUser();
  const context = await requireWorkspaceContext("read");
  const workspace = context.workspace;

  const status = connectStatusFromFlags({
    stripeAccountId: workspace.stripeAccountId,
    stripeChargesEnabled: workspace.stripeChargesEnabled,
    stripeDetailsSubmitted: workspace.stripeDetailsSubmitted,
  });

  const canManage =
    context.membership.role === "OWNER" && context.permissions.canWrite;

  return (
    <main className="min-h-dvh px-6 py-8 text-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/settings"
          className="forge-back-link text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Paiement en ligne
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Encaisse tes factures par carte bancaire ou par virement. Forge ne
          prend aucune commission ; seuls les frais Stripe s’appliquent et sont
          affichés sur chaque encaissement.
        </p>

        <div className="mt-8 space-y-4">
          {!isStripeConfigured() ? (
            <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              Le paiement en ligne n’est pas encore activé sur cette
              installation.
            </p>
          ) : !context.subscription.hasAccess ? (
            <div className="rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-5">
              <p className="font-bold text-[var(--forge-text-primary)]">
                Réservé aux formules payantes
              </p>
              <p className="mt-1 text-sm text-[var(--forge-text-secondary)]">
                Le paiement en ligne est disponible avec un abonnement Forge.
              </p>
              <Link
                href="/subscription"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-5 font-bold text-white"
              >
                Voir les formules
              </Link>
            </div>
          ) : (
            <ConnectPaymentsCard
              status={status}
              canManage={canManage}
              payoutsEnabled={workspace.stripePayoutsEnabled}
            />
          )}
        </div>
      </section>
    </main>
  );
}
