"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  templateId: string;
};

export default function UseQuoteTemplateButton({ templateId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/quotes/from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = await response.json();
      if (!response.ok || !data.path) {
        throw new Error(data.error || "Impossible de créer le devis.");
      }
      router.push(`${data.path}/edit`);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Impossible de créer le devis.",
      );
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={create}
        disabled={busy}
        className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {busy ? "Création…" : "Créer un devis"}
      </button>
      {error ? (
        <span className="ml-2 text-xs font-medium text-red-600">{error}</span>
      ) : null}
    </>
  );
}
