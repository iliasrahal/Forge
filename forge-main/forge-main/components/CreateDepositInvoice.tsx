"use client";

import { Percent, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { calculateDepositAmount, type DepositMode } from "@/src/lib/deposits";

type CreateDepositInvoiceProps = {
  quoteId: string;
  quoteTotalCents: number;
  alreadyDepositedCents: number;
};

function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}

export default function CreateDepositInvoice({
  quoteId,
  quoteTotalCents,
  alreadyDepositedCents,
}: CreateDepositInvoiceProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DepositMode>("PERCENTAGE");
  const [value, setValue] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculation = useMemo(
    () =>
      calculateDepositAmount({
        mode,
        value,
        quoteTotalCents,
        alreadyDepositedCents,
      }),
    [alreadyDepositedCents, mode, quoteTotalCents, value],
  );

  async function submit() {
    if (!calculation.ok || loading) {
      if (!calculation.ok) setError(calculation.error);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/invoices/create-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, mode, value }),
      });
      const data = await response.json();

      if (!response.ok || !data.invoice?.id) {
        throw new Error(data.error || "Impossible de créer cette facture d’acompte.");
      }

      router.push(`/invoices/${data.invoice.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible de créer cette facture d’acompte.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
      >
        Créer un acompte
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <section className="forge-surface w-full max-w-md rounded-[2rem] border p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--forge-accent-blue-lit)]">
                  Facture d’acompte
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[var(--forge-text-primary)]">
                  Créer un acompte
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="grid h-10 w-10 place-items-center rounded-full text-[var(--forge-text-secondary)] transition hover:bg-[var(--forge-surface-hover)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--forge-surface-secondary)] p-1.5">
              {(["PERCENTAGE", "FIXED"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMode(item);
                    setValue(item === "PERCENTAGE" ? "30" : "");
                    setError("");
                  }}
                  className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition ${
                    mode === item
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-surface-hover)]"
                  }`}
                >
                  {item === "PERCENTAGE" ? "Pourcentage" : "Montant fixe"}
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-[var(--forge-text-primary)]">
                {mode === "PERCENTAGE" ? "Pourcentage" : "Montant"}
              </span>
              <span className="relative mt-2 block">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setError("");
                  }}
                  className="h-13 w-full rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 pr-12 text-lg font-semibold text-[var(--forge-text-primary)] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]">
                  {mode === "PERCENTAGE" ? <Percent size={18} /> : "€"}
                </span>
              </span>
            </label>

            <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="flex items-center justify-between gap-4 text-sm text-[var(--forge-text-secondary)]">
                <span>Total du devis</span>
                <strong className="text-[var(--forge-text-primary)]">
                  {formatAmount(quoteTotalCents)}
                </strong>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="font-semibold text-[var(--forge-text-primary)]">Acompte</span>
                <strong className="text-xl text-[var(--forge-accent-blue-lit)]">
                  {formatAmount(calculation.ok ? calculation.amountCents : 0)}
                </strong>
              </div>
            </div>

            {error ? <p className="mt-3 text-sm font-medium text-red-500">{error}</p> : null}

            <button
              type="button"
              onClick={submit}
              disabled={loading || !calculation.ok}
              className="mt-5 min-h-12 w-full rounded-2xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Création…" : "Créer la facture d’acompte"}
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
