"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ForgeListenCard from "@/components/ForgeListenCard";
import ForgeProcessingCard from "@/components/ForgeProcessingCard";
import ForgeReportCard from "@/components/ForgeReportCard";
import type { InterventionDayReport } from "@/src/lib/intervention-day-report";

type FlowState = "input" | "processing" | "review";

export default function InterventionDayReportFlow({
  interventionId,
  date,
  clientName,
  initialDraft,
  initialReport,
}: {
  interventionId: string;
  date: string;
  clientName: string;
  initialDraft: string;
  initialReport: InterventionDayReport | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<FlowState>(initialReport ? "review" : "input");
  const [draft, setDraft] = useState(initialDraft);
  const [media, setMedia] = useState<File[]>([]);
  const [report, setReport] = useState<InterventionDayReport | null>(initialReport);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function update(operation: string, extra: Record<string, unknown> = {}) {
    const response = await fetch(`/api/interventions/${interventionId}/days`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, operation, ...extra }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Impossible d’enregistrer cette journée.");
  }

  function returnToPlanning() {
    router.push(`/interventions/${interventionId}`);
    router.refresh();
  }

  async function skipReport() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await update("skipReport");
      returnToPlanning();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de terminer cette journée.");
      setPending(false);
    }
  }

  async function validateReport() {
    if (!report || pending) return;
    setPending(true);
    setError("");
    try {
      await update("complete", { report });
      returnToPlanning();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible d’enregistrer le compte rendu.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-4xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:min-h-screen lg:justify-center lg:py-10">
      <Link href={`/interventions/${interventionId}`} className="forge-back-link mb-4 self-start">← Retour au chantier</Link>
      {state === "input" && (
        <section className="flex flex-col items-center">
          <button type="button" disabled={pending} onClick={() => void skipReport()} className="mb-4 min-h-11 rounded-full border border-[var(--forge-border-strong)] bg-[var(--forge-surface-secondary)] px-6 py-2.5 text-sm font-semibold text-[var(--forge-text-secondary)] disabled:opacity-60 sm:mb-6">
            {pending ? "Clôture en cours…" : "Passer le compte rendu"}
          </button>
          <ForgeListenCard
            clientName={clientName}
            onStartProcessing={() => { setError(""); setState("processing"); }}
            onReportGenerated={(generated) => {
              setReport(generated);
              void update("saveReportReview", { report: generated })
                .then(() => setState("review"))
                .catch((caught) => {
                  setError(caught instanceof Error ? caught.message : "Impossible d’enregistrer le brouillon du compte rendu.");
                  setState("review");
                });
            }}
            onError={(message) => { setError(message); if (message) setState("input"); }}
            message={draft}
            onMessageChange={(message) => {
              setDraft(message);
              void update("saveReportDraft", { reportDraft: message }).catch(() => undefined);
            }}
            selectedMedia={media}
            onSelectedMediaChange={setMedia}
            errorMessage={error}
          />
        </section>
      )}
      {state === "processing" && <section className="flex flex-1 items-center justify-center"><ForgeProcessingCard /></section>}
      {state === "review" && report && <ForgeReportCard report={report} onEdit={() => setState("input")} onValidate={() => void validateReport()} isValidating={pending} error={error} />}
    </main>
  );
}
