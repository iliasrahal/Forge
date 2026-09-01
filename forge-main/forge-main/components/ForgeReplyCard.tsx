"use client";

import { useState } from "react";

type ForgeReplyCardProps = {
  reply: string;
  onEdit: () => void;
  onCopied: () => void;
};

export default function ForgeReplyCard({
  reply,
  onEdit,
  onCopied,
}: ForgeReplyCardProps) {
  const [hasCopied, setHasCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reply);
      setHasCopied(true);

      window.setTimeout(() => {
        onCopied();
      }, 1200);
    } catch {
      setHasCopied(false);
    }
  }

  return (
    <div className="flex max-h-[calc(100dvh-18rem)] w-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60">
      <h2 className="shrink-0 text-center text-2xl font-bold text-blue-700">
        Ta réponse est prête
      </h2>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-2xl bg-slate-50 p-5">
        <p className="whitespace-pre-wrap text-base leading-8 text-slate-700">
          {reply}
        </p>
      </div>

      <div className="mt-5 flex shrink-0 justify-end gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border-2 border-blue-600 px-6 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          Modifier
        </button>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          {hasCopied ? "Copié" : "Copier"}
        </button>
      </div>
    </div>
  );
}
