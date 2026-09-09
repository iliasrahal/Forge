"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  creditNoteId: string;
  invoiceId: string;
  status: string;
  canWrite: boolean;
};

export default function CreditNoteActions({
  creditNoteId,
  invoiceId,
  status,
  canWrite,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"issue" | "delete" | null>(null);
  const [error, setError] = useState("");

  async function issue() {
    if (busy) return;
    setBusy("issue");
    setError("");
    try {
      const response = await fetch(
        `/api/credit-notes/${creditNoteId}/issue`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible d’émettre l’avoir.");
      }
      router.refresh();
    } catch (issueError) {
      setError(
        issueError instanceof Error
          ? issueError.message
          : "Impossible d’émettre l’avoir.",
      );
      setBusy(null);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy("delete");
    setError("");
    try {
      const response = await fetch(`/api/credit-notes/${creditNoteId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible de supprimer l’avoir.");
      }
      router.push(`/invoices/${invoiceId}`);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossible de supprimer l’avoir.",
      );
      setBusy(null);
    }
  }

  if (!canWrite || status !== "BROUILLON") {
    return error ? (
      <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
    ) : null;
  }

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={issue}
        disabled={busy !== null}
        className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {busy === "issue" ? "Émission…" : "Émettre l’avoir"}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy !== null}
        className="w-full rounded-2xl border border-slate-300 px-5 py-3 text-center font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {busy === "delete" ? "Suppression…" : "Supprimer le brouillon"}
      </button>
      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
