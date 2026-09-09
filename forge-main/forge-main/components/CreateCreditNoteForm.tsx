"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LineOption = {
  id: string;
  label: string;
  amountCents: number;
};

type Props = {
  invoiceId: string;
  lines: LineOption[];
  maxCreditableCents: number;
};

function formatEur(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function CreateCreditNoteForm({
  invoiceId,
  lines,
  maxCreditableCents,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"FULL" | "PARTIAL">("FULL");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(lines.map((line) => line.id)),
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeIds = mode === "FULL" ? lines.map((l) => l.id) : [...selected];
  const total = lines
    .filter((line) => activeIds.includes(line.id))
    .reduce((sum, line) => sum + line.amountCents, 0);

  function toggle(lineId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  }

  async function submit() {
    if (saving) return;
    if (!reason.trim()) {
      setError("Le motif de l’avoir est obligatoire.");
      return;
    }
    if (mode === "PARTIAL" && selected.size === 0) {
      setError("Sélectionne au moins une ligne à créditer.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/invoices/${invoiceId}/credit-notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            reason: reason.trim(),
            lineIds: mode === "PARTIAL" ? [...selected] : undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.id) {
        throw new Error(data.error || "Impossible de créer l’avoir.");
      }
      router.push(`/credit-notes/${data.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible de créer l’avoir.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Type d’avoir
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("FULL")}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
              mode === "FULL"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Avoir total
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Reprend toutes les lignes de la facture
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("PARTIAL")}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
              mode === "PARTIAL"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Avoir partiel
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Choisis les lignes à créditer
            </span>
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Lignes créditées
        </p>
        <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
          {lines.map((line) => {
            const checked =
              mode === "FULL" ? true : selected.has(line.id);
            return (
              <label
                key={line.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={mode === "FULL"}
                    onChange={() => toggle(line.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-slate-800 dark:text-slate-100">
                    {line.label}
                  </span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatEur(line.amountCents)}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Montant de l’avoir :{" "}
          <span className="font-bold">{formatEur(total)}</span>
          <span className="text-xs text-slate-500">
            {" "}
            · avoirable au plus {formatEur(maxCreditableCents)}
          </span>
        </p>
      </div>

      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        Motif de l’avoir
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Geste commercial, erreur de facturation, prestation annulée…"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </label>

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? "Création…" : "Créer l’avoir (brouillon)"}
      </button>
    </div>
  );
}
