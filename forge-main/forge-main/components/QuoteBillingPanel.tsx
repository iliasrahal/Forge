"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LinkedInvoice = {
  id: string;
  reference: string;
  type: string;
  status: string;
  amountCents: number;
};

type Props = {
  quoteId: string;
  quoteTtcCents: number;
  retentionPercent: number;
  billedCents: number;
  billedBp: number;
  remainingCents: number;
  retentionWithheldCents: number;
  isFullyBilled: boolean;
  canWrite: boolean;
  canBill: boolean;
  invoices: LinkedInvoice[];
};

const TYPE_LABELS: Record<string, string> = {
  STANDARD: "Facture",
  DEPOSIT: "Acompte",
  SITUATION: "Situation",
  BALANCE: "Solde",
};

function formatEur(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function QuoteBillingPanel({
  quoteId,
  quoteTtcCents,
  retentionPercent,
  billedCents,
  billedBp,
  remainingCents,
  retentionWithheldCents,
  isFullyBilled,
  canWrite,
  canBill,
  invoices,
}: Props) {
  const router = useRouter();
  const [retention, setRetention] = useState(String(retentionPercent));
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState<"retention" | "situation" | "balance" | null>(
    null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function saveRetention() {
    if (busy) return;
    setBusy("retention");
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionPercent: retention.replace(",", ".") }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible d’enregistrer la retenue.");
      }
      setNotice("Retenue de garantie enregistrée.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d’enregistrer la retenue.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function createSituation() {
    if (busy) return;
    const value = Number(progress.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      setError("Renseigne un avancement cumulé entre 1 et 100 %.");
      return;
    }
    setBusy("situation");
    setError("");
    try {
      const response = await fetch(`/api/quotes/${quoteId}/situations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressPercent: progress.replace(",", ".") }),
      });
      const data = await response.json();
      if (!response.ok || !data.id) {
        throw new Error(data.error || "Impossible de créer la situation.");
      }
      router.push(`/invoices/${data.id}`);
    } catch (situationError) {
      setError(
        situationError instanceof Error
          ? situationError.message
          : "Impossible de créer la situation.",
      );
      setBusy(null);
    }
  }

  async function createBalance() {
    if (busy) return;
    setBusy("balance");
    setError("");
    try {
      const response = await fetch(
        `/api/quotes/${quoteId}/balance-invoice`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok || !data.id) {
        throw new Error(data.error || "Impossible de créer la facture de solde.");
      }
      router.push(`/invoices/${data.id}`);
    } catch (balanceError) {
      setError(
        balanceError instanceof Error
          ? balanceError.message
          : "Impossible de créer la facture de solde.",
      );
      setBusy(null);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
      <p className="font-bold text-slate-800 dark:text-slate-100">Facturation</p>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${Math.min(100, billedBp / 100)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        <span className="font-semibold">{(billedBp / 100).toLocaleString("fr-FR")} %</span>{" "}
        facturé · {formatEur(billedCents)} sur {formatEur(quoteTtcCents)} ·{" "}
        reste {formatEur(remainingCents)}
        {retentionWithheldCents > 0
          ? ` · retenue cumulée ${formatEur(retentionWithheldCents)}`
          : ""}
      </p>

      {invoices.length > 0 ? (
        <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link
                href={`/invoices/${invoice.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm transition hover:bg-white dark:hover:bg-slate-900"
              >
                <span className="text-slate-700 dark:text-slate-200">
                  {TYPE_LABELS[invoice.type] ?? invoice.type}
                  {invoice.status === "ANNULEE" ? " (annulée)" : ""}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatEur(invoice.amountCents)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {canWrite ? (
        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Retenue de garantie
            <div className="mt-1 flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={retention}
                onChange={(event) => setRetention(event.target.value)}
                className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </label>
          <button
            type="button"
            onClick={saveRetention}
            disabled={busy !== null}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-white disabled:opacity-60 dark:border-slate-600 dark:text-slate-300"
          >
            {busy === "retention" ? "…" : "Enregistrer"}
          </button>
        </div>
      ) : null}

      {canBill && !isFullyBilled ? (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Situation de travaux — avancement cumulé
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={progress}
                  placeholder="ex. 60"
                  onChange={(event) => setProgress(event.target.value)}
                  className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </label>
            <button
              type="button"
              onClick={createSituation}
              disabled={busy !== null}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {busy === "situation" ? "Création…" : "Créer la situation"}
            </button>
          </div>
          <button
            type="button"
            onClick={createBalance}
            disabled={busy !== null}
            className="w-full rounded-xl border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            {busy === "balance" ? "Création…" : "Créer la facture de solde"}
          </button>
        </div>
      ) : null}

      {isFullyBilled ? (
        <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Ce devis est entièrement facturé.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
