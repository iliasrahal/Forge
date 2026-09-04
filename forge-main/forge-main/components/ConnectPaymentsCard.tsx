"use client";

import { ArrowUpRight, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

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

export default function ConnectPaymentsCard({
  status,
  canManage,
  payoutsEnabled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const copy = STATUS_COPY[status];

  async function start() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/connect/start", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "La configuration n’a pas pu démarrer.");
      }
      window.location.href = data.url;
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "La configuration n’a pas pu démarrer.",
      );
      setLoading(false);
    }
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
      ) : status === "none" ? (
        <button
          type="button"
          onClick={start}
          disabled={loading}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-4 font-bold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <ArrowUpRight size={17} />}
          {loading ? "Redirection…" : "Activer les paiements en ligne"}
        </button>
      ) : status === "active" ? (
        <a
          href="/api/stripe/connect/dashboard"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--forge-border)] px-4 font-semibold text-[var(--forge-text-primary)] transition hover:bg-[var(--forge-surface-hover)]"
        >
          <ExternalLink size={16} />
          Gérer mon compte Stripe
        </a>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a
            href="/api/stripe/connect/refresh"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-4 font-bold text-white transition hover:opacity-95"
          >
            <ArrowUpRight size={17} />
            Reprendre la configuration
          </a>
          <a
            href="/api/stripe/connect/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--forge-border)] px-4 font-semibold text-[var(--forge-text-primary)] transition hover:bg-[var(--forge-surface-hover)]"
          >
            <ExternalLink size={16} />
            Tableau de bord Stripe
          </a>
        </div>
      )}
    </section>
  );
}
