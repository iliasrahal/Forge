"use client";

import { Banknote, Plus, Trash2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  computeInvoicePaymentState,
  formatPaymentMethod,
  MANUAL_PAYMENT_METHODS,
} from "@/src/lib/payments";

export type InvoicePaymentRow = {
  id: string;
  provider: "STRIPE" | "MANUAL";
  status: string;
  method: string | null;
  amountCents: number;
  feeCents: number;
  refundedCents: number;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
  recordedByName: string | null;
};

type Props = {
  invoiceId: string;
  invoiceTtcCents: number;
  canRecord: boolean;
  payments: InvoicePaymentRow[];
};

const METHOD_OPTIONS: Array<{ value: (typeof MANUAL_PAYMENT_METHODS)[number]; label: string }> = [
  { value: "virement", label: "Virement" },
  { value: "cheque", label: "Chèque" },
  { value: "especes", label: "Espèces" },
];

function formatEur(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function InvoicePaymentsPanel({
  invoiceId,
  invoiceTtcCents,
  canRecord,
  payments,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof MANUAL_PAYMENT_METHODS)[number]>(
    "virement",
  );
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(todayInputValue());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const state = computeInvoicePaymentState(
    invoiceTtcCents,
    payments.map((payment) => ({
      status: payment.status,
      amountCents: payment.amountCents,
      feeCents: payment.feeCents,
      refundedCents: payment.refundedCents,
      paidAt: payment.paidAt,
    })),
  );

  const hasFees = state.feeCents > 0;
  const showForm = canRecord && state.remainingCents > 0;

  function openForm() {
    setAmount((state.remainingCents / 100).toFixed(2));
    setMethod("virement");
    setReference("");
    setPaidAt(todayInputValue());
    setError("");
    setOpen(true);
  }

  async function submit() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount.replace(",", "."),
          method,
          reference: reference.trim() || undefined,
          paidAt: paidAt || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible d’enregistrer le paiement.");
      }
      setOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d’enregistrer le paiement.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(paymentId: string) {
    if (deletingId) return;
    setDeletingId(paymentId);
    setError("");
    try {
      const response = await fetch(
        `/api/invoices/${invoiceId}/payments/${paymentId}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible de supprimer le paiement.");
      }
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossible de supprimer le paiement.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Wallet size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--forge-text-primary)]">Encaissement</p>
          <p className="mt-1 text-sm text-[var(--forge-text-secondary)]">
            {state.isFullyPaid
              ? "Cette facture est intégralement réglée."
              : state.collectedCents > 0
                ? `Reste à encaisser ${formatEur(state.remainingCents)} sur ${formatEur(invoiceTtcCents)}.`
                : `Aucun paiement encaissé sur ${formatEur(invoiceTtcCents)}.`}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="rounded-xl bg-[var(--forge-surface)] px-3 py-2">
          <dt className="text-xs text-[var(--forge-text-muted)]">Encaissé</dt>
          <dd className="mt-0.5 font-bold text-[var(--forge-text-primary)]">
            {formatEur(state.collectedCents)}
          </dd>
        </div>
        <div className="rounded-xl bg-[var(--forge-surface)] px-3 py-2">
          <dt className="text-xs text-[var(--forge-text-muted)]">Reste dû</dt>
          <dd className="mt-0.5 font-bold text-[var(--forge-text-primary)]">
            {formatEur(state.remainingCents)}
          </dd>
        </div>
        <div className="rounded-xl bg-[var(--forge-surface)] px-3 py-2">
          <dt className="text-xs text-[var(--forge-text-muted)]">Frais</dt>
          <dd className="mt-0.5 font-bold text-[var(--forge-text-primary)]">
            {hasFees ? `− ${formatEur(state.feeCents)}` : "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-[var(--forge-surface)] px-3 py-2">
          <dt className="text-xs text-[var(--forge-text-muted)]">Net reçu</dt>
          <dd className="mt-0.5 font-bold text-[var(--forge-text-primary)]">
            {hasFees ? formatEur(state.netCents) : formatEur(state.collectedCents)}
          </dd>
        </div>
      </dl>

      {payments.length > 0 ? (
        <ul className="mt-4 divide-y divide-[var(--forge-border)] border-t border-[var(--forge-border)]">
          {payments.map((payment) => {
            const net = payment.amountCents - payment.refundedCents;
            return (
              <li
                key={payment.id}
                className="flex items-start justify-between gap-3 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold text-[var(--forge-text-primary)]">
                    {payment.provider === "STRIPE" ? (
                      <Banknote size={15} className="text-[var(--forge-accent-blue-lit)]" />
                    ) : (
                      <Banknote size={15} className="text-emerald-500" />
                    )}
                    {formatPaymentMethod(payment.method)}
                    {payment.status !== "SUCCEEDED" ? (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {payment.status === "PENDING"
                          ? "En attente"
                          : payment.status === "REFUNDED"
                            ? "Remboursé"
                            : payment.status === "FAILED"
                              ? "Échoué"
                              : "Annulé"}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--forge-text-muted)]">
                    {formatDate(payment.paidAt ?? payment.createdAt)}
                    {payment.reference ? ` · ${payment.reference}` : ""}
                    {payment.provider === "STRIPE" ? " · en ligne" : ""}
                    {payment.recordedByName
                      ? ` · saisi par ${payment.recordedByName}`
                      : ""}
                    {payment.refundedCents > 0
                      ? ` · remboursé ${formatEur(payment.refundedCents)}`
                      : ""}
                    {payment.feeCents > 0
                      ? ` · frais ${formatEur(payment.feeCents)}`
                      : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-bold text-[var(--forge-text-primary)]">
                    {formatEur(net)}
                  </span>
                  {canRecord && payment.provider === "MANUAL" ? (
                    <button
                      type="button"
                      onClick={() => remove(payment.id)}
                      disabled={deletingId !== null}
                      aria-label="Supprimer ce paiement"
                      className="grid h-8 w-8 place-items-center rounded-lg text-[var(--forge-text-muted)] transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showForm && !open ? (
        <button
          type="button"
          onClick={openForm}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/50 px-4 font-semibold text-emerald-600 transition hover:bg-emerald-500/10 dark:text-emerald-400"
        >
          <Plus size={17} />
          Enregistrer un paiement
        </button>
      ) : null}

      {showForm && open ? (
        <div className="mt-4 border-t border-[var(--forge-border)] pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--forge-text-primary)]">
              Montant reçu
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--forge-border)] bg-[var(--forge-input-background)] px-3 py-2 text-base text-[var(--forge-text-primary)] outline-none focus:border-emerald-500"
                />
                <span className="font-semibold text-[var(--forge-text-secondary)]">€</span>
              </div>
            </label>

            <label className="text-sm font-semibold text-[var(--forge-text-primary)]">
              Moyen
              <select
                value={method}
                onChange={(event) =>
                  setMethod(
                    event.target.value as (typeof MANUAL_PAYMENT_METHODS)[number],
                  )
                }
                className="mt-1 w-full rounded-xl border border-[var(--forge-border)] bg-[var(--forge-input-background)] px-3 py-2 text-base text-[var(--forge-text-primary)] outline-none focus:border-emerald-500"
              >
                {METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-[var(--forge-text-primary)]">
              Date d’encaissement
              <input
                type="date"
                value={paidAt}
                max={todayInputValue()}
                onChange={(event) => setPaidAt(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--forge-border)] bg-[var(--forge-input-background)] px-3 py-2 text-base text-[var(--forge-text-primary)] outline-none focus:border-emerald-500"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--forge-text-primary)]">
              Référence <span className="font-normal text-[var(--forge-text-muted)]">(facultatif)</span>
              <input
                type="text"
                value={reference}
                maxLength={190}
                placeholder="N° de chèque, libellé du virement…"
                onChange={(event) => setReference(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--forge-border)] bg-[var(--forge-input-background)] px-3 py-2 text-base text-[var(--forge-text-primary)] outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
          ) : null}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              disabled={saving}
              className="min-h-11 rounded-2xl border border-[var(--forge-border)] px-4 font-semibold text-[var(--forge-text-primary)]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving || !amount.trim()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      ) : null}

      {error && !open ? (
        <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
      ) : null}
    </section>
  );
}
