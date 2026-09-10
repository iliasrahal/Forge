"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteInterventionButton({ interventionId, hasHistory, hasFinancialDocuments }: { interventionId: string; hasHistory: boolean; hasFinancialDocuments: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setPending(true);
    setError("");
    const response = await fetch("/api/interventions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interventionId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Impossible de supprimer ce chantier.");
      setPending(false);
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
        Supprimer le chantier
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-intervention-title" className="forge-surface w-full max-w-sm rounded-[2rem] border p-6 text-center">
            <h2 id="delete-intervention-title" className="text-xl font-bold text-[var(--forge-text-primary)]">Supprimer définitivement ce chantier ?</h2>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--forge-text-secondary)]">
              <p>Cette action est définitive.</p>
              <p>{hasHistory ? "Le planning, les tâches, les temps, les dépenses et les comptes rendus liés à ce chantier seront supprimés." : "Le chantier et son planning associé seront supprimés."}</p>
              {hasFinancialDocuments && <p className="font-semibold text-[var(--forge-text-primary)]">Les devis, factures et paiements existants seront conservés.</p>}
            </div>
            {error && <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" disabled={pending} onClick={() => { setOpen(false); setError(""); }} className="min-h-12 rounded-2xl border border-[var(--forge-border-strong)] px-4 font-semibold text-[var(--forge-text-primary)] disabled:opacity-50">Annuler</button>
              <button type="button" disabled={pending} onClick={() => void remove()} className="min-h-12 rounded-2xl bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">{pending ? "Suppression…" : "Supprimer définitivement"}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
