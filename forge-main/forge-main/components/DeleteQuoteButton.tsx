"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteQuoteButton({
  quoteId,
}: {
  quoteId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteQuote() {
    if (deleting) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Impossible de supprimer ce devis.");
      }

      router.push("/quotes");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de supprimer ce devis.",
      );
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="min-h-12 w-full rounded-2xl border border-red-500/60 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
      >
        Supprimer le devis
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-quote-title"
            className="forge-surface w-full max-w-sm rounded-[2rem] border p-6 text-center"
          >
            <h2
              id="delete-quote-title"
              className="text-xl font-bold text-[var(--forge-text-primary)]"
            >
              Supprimer ce devis ?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--forge-text-secondary)]">
              Cette action supprimera définitivement ce devis.
            </p>

            {error ? (
              <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="min-h-12 rounded-2xl border border-[var(--forge-border-strong)] px-4 font-semibold text-[var(--forge-text-primary)] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void deleteQuote()}
                disabled={deleting}
                className="min-h-12 rounded-2xl bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
