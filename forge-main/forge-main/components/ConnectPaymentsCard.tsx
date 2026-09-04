"use client";

import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { ArrowUpRight, CreditCard, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { StripeConnectInstance } from "@stripe/connect-js";

import type { ConnectStatus } from "@/src/lib/stripe-connect";

type Props = {
  status: ConnectStatus;
  canManage: boolean;
  payoutsEnabled: boolean;
};

const STATUS_COPY: Record<
  ConnectStatus,
  { label: string; tone: string; description: string }
> = {
  none: {
    label: "Non configuré",
    tone: "bg-[var(--forge-surface-strong)] text-[var(--forge-text-secondary)]",
    description:
      "Connecte un compte Stripe pour encaisser tes factures par carte et par virement, avec mise à jour automatique du statut.",
  },
  pending: {
    label: "En attente",
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    description:
      "La configuration Stripe a été démarrée mais n’est pas terminée. Reprends-la pour activer les paiements.",
  },
  restricted: {
    label: "À compléter",
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    description:
      "Stripe a besoin d’informations supplémentaires avant d’autoriser les encaissements.",
  },
  active: {
    label: "Actif",
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    description:
      "Tes factures envoyées incluent un lien de paiement. Les encaissements sont réconciliés automatiquement.",
  },
};

async function fetchOnboardingClientSecret() {
  const response = await fetch("/api/stripe/connect/onboarding-session", {
    method: "POST",
  });
  const data = await response.json();
  if (!response.ok || !data.clientSecret) {
    throw new Error(data.error || "La configuration n’a pas pu démarrer.");
  }
  return data.clientSecret as string;
}

export default function ConnectPaymentsCard({
  status,
  canManage,
  payoutsEnabled,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [connectInstance, setConnectInstance] =
    useState<StripeConnectInstance | null>(null);
  const copy = STATUS_COPY[status];

  function startOnboarding() {
    setError("");
    setConnectInstance(
      loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
        fetchClientSecret: fetchOnboardingClientSecret,
        locale: "fr",
        appearance: {
          variables: { colorPrimary: "#3b5bfd" },
        },
      }),
    );
  }

  if (connectInstance) {
    return (
      <section className="forge-surface rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--forge-accent-blue-lit)]/15 text-[var(--forge-accent-blue-lit)]">
            <CreditCard size={19} />
          </span>
          <p className="font-bold text-[var(--forge-text-primary)]">
            Configuration du paiement en ligne
          </p>
        </div>
        <div className="mt-4">
          <ConnectComponentsProvider connectInstance={connectInstance}>
            <ConnectAccountOnboarding
              onExit={() => {
                setConnectInstance(null);
                router.refresh();
              }}
              onLoadError={({ error: loadError }) => {
                setConnectInstance(null);
                setError(
                  loadError.message ||
                    "La configuration n’a pas pu être chargée.",
                );
              }}
            />
          </ConnectComponentsProvider>
        </div>
      </section>
    );
  }

  return (
    <section className="forge-surface rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--forge-accent-blue-lit)]/15 text-[var(--forge-accent-blue-lit)]">
          <CreditCard size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-[var(--forge-text-primary)]">
              Paiement en ligne
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${copy.tone}`}
            >
              {copy.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--forge-text-secondary)]">
            {copy.description}
          </p>
          {status === "active" && !payoutsEnabled ? (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              Les virements vers ton compte bancaire ne sont pas encore activés
              par Stripe. Complète ton profil depuis le tableau de bord.
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
      ) : null}

      {!canManage ? (
        <p className="mt-4 text-sm text-[var(--forge-text-muted)]">
          Seul le propriétaire de l’espace peut gérer le compte de paiement.
        </p>
      ) : status === "active" ? (
        <a
          href="/api/stripe/connect/dashboard"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--forge-border)] px-4 font-semibold text-[var(--forge-text-primary)] transition hover:bg-[var(--forge-surface-hover)]"
        >
          <ExternalLink size={16} />
          Gérer mon compte Stripe
        </a>
      ) : (
        <button
          type="button"
          onClick={startOnboarding}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-4 font-bold text-white transition hover:opacity-95"
        >
          <ArrowUpRight size={17} />
          {status === "none"
            ? "Activer les paiements en ligne"
            : "Reprendre la configuration"}
        </button>
      )}
    </section>
  );
}
