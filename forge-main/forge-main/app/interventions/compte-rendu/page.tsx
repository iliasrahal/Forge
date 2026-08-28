"use client";

import { useState } from "react";
import Link from "next/link";

type InterventionReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};

export default function InterventionReportPage() {
  const [interventionText, setInterventionText] =
    useState("");

  const [report, setReport] =
    useState<InterventionReport | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

    const [acceptedTerms, setAcceptedTerms] =
useState(false);

  const [error, setError] =
    useState("");

  async function handleGenerateReport() {
    const intervention = interventionText.trim();

    if (!intervention || isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch(
        "/api/interventions/report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intervention,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible de créer le compte rendu.",
        );
      }

      setReport({
        intervention:
          data.intervention || "Non précisé",
        diagnostic:
          data.diagnostic || "Non précisé",
        travaux:
          data.travaux || "Non précisé",
        recommandation:
          data.recommandation || "Non précisé",
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Une erreur est survenue.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/interventions"
          className="mb-6 inline-flex items-center text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>Retour</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-600 sm:text-3xl">
              Raconte-moi ton intervention
            </h1>
          </div>

          <textarea
            id="intervention"
            value={interventionText}
            onChange={(event) => {
              setInterventionText(event.target.value);
              setReport(null);
              setError("");
            }}
            placeholder="Exemple : J'ai remplacé un chauffe-eau qui fuyait."
            rows={8}
            aria-label="Raconte ton intervention"
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950 dark:disabled:bg-slate-700"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled
              className="rounded-xl border border-blue-600 px-5 py-3 font-semibold text-blue-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 dark:disabled:border-slate-700 dark:disabled:text-slate-500"
            >
              Parler à Forge
            </button>

            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={
                !interventionText.trim() ||
                isLoading
              }
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading
                ? "Création en cours..."
                : "Créer le compte rendu"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <h2 className="text-lg font-bold text-blue-600">
            Compte rendu généré
          </h2>

          {!report ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              {isLoading
                ? "Forge prépare ton compte rendu..."
                : "Le résultat apparaîtra ici après la création."}
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Intervention réalisée
                </h3>

                <p className="mt-2 whitespace-pre-line text-slate-700">
                  {report.intervention}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Diagnostic
                </h3>

                <p className="mt-2 whitespace-pre-line text-slate-700">
                  {report.diagnostic}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Travaux effectués
                </h3>

                <p className="mt-2 whitespace-pre-line text-slate-700">
                  {report.travaux}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Recommandation
                </h3>

                <p className="mt-2 whitespace-pre-line text-slate-700">
                  {report.recommandation}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
