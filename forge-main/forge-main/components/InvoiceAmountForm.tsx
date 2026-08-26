"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InvoiceAmountFormProps = {
  invoiceId: string;
  amountCents: number;
};

export default function InvoiceAmountForm({
  invoiceId,
  amountCents,
}: InvoiceAmountFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState((amountCents / 100).toFixed(2));
  const [isEditing, setIsEditing] = useState(amountCents === 0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const normalizedAmount = amount.replace(",", ".").trim();
    const parsedAmount = Number(normalizedAmount);

    if (!normalizedAmount || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("Saisis un montant valide.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible d’enregistrer le montant.");
      }

      setAmount((data.invoice.amountCents / 100).toFixed(2));
      setIsEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d’enregistrer le montant.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl bg-blue-50 p-5 dark:bg-blue-950">
      <p className="text-sm text-blue-700 dark:text-blue-300">Montant</p>

      {isEditing ? (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              onBlur={() => void handleSave()}
              className="min-w-0 flex-1 rounded-xl border border-blue-300 bg-white px-3 py-2 text-2xl font-bold text-blue-700 outline-none focus:border-blue-500 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
            />
            <span className="font-semibold text-blue-700 dark:text-blue-300">€</span>
          </div>

          {isSaving && (
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              Enregistrement...
            </p>
          )}

          {error && (
            <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(amountCents / 100)}
          </p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-sm font-semibold text-blue-700 dark:text-blue-300"
          >
            Modifier
          </button>
        </div>
      )}
    </div>
  );
}
