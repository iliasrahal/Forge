"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  quoteId: string;
  defaultName: string;
};

export default function SaveQuoteAsTemplateButton({
  quoteId,
  defaultName,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function save() {
    if (busy) return;
    if (!name.trim()) {
      setError("Donne un nom au modèle.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/quotes/${quoteId}/save-as-template`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible d’enregistrer le modèle.");
      }
      setDone(true);
      setOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d’enregistrer le modèle.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        Modèle enregistré ·{" "}
        <a href="/settings/quote-templates" className="underline">
          voir mes modèles
        </a>
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
      >
        Enregistrer comme modèle
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Nom du modèle
        <input
          type="text"
          value={name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
      </label>
      {error ? (
        <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
