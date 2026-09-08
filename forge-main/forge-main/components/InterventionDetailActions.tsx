"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  interventionId: string;
  status: string;
  canWrite: boolean;
};

export default function InterventionDetailActions({ interventionId, status, canWrite }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!canWrite || (status !== "PLANIFIEE" && status !== "EN_COURS")) return null;

  async function start() {
    setPending(true);
    setError("");
    const response = await fetch("/api/interventions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "start", interventionId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPending(false);
      setError(typeof data.error === "string" ? data.error : "Impossible de démarrer ce chantier.");
      return;
    }
    router.push(`/app?newIntervention=${interventionId}`);
    router.refresh();
  }

  return (
    <div className="mx-auto mt-6 max-w-sm text-center">
      {status === "PLANIFIEE" ? (
        <button disabled={pending} type="button" onClick={start} className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Démarrage…" : "Commencer le chantier"}
        </button>
      ) : (
        <button type="button" onClick={() => router.push(`/app?newIntervention=${interventionId}`)} className="w-full rounded-2xl border border-blue-300 bg-white/60 px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900/50 dark:text-blue-300 dark:hover:bg-blue-950/50">
          Continuer ou terminer le chantier
        </button>
      )}
      {error && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
