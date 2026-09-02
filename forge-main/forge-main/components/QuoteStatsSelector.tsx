"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getParisYearMonth } from "@/src/lib/document-history";

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

const months = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export type HistoryDocument = {
  id: string;
  title: string;
  reference: string;
  amountCents: number;
  createdAt: string;
  statusLabel: string;
  href: string;
  clientName?: string;
  badge?: string;
  attention?: string;
};

type QuoteStatsSelectorProps = {
  year: number;
  years: number[];
  initialDocuments: HistoryDocument[];
  statsEndpoint?: string;
  documentLabel?: "devis" | "facture";
};

export default function QuoteStatsSelector({
  year,
  years,
  initialDocuments,
  statsEndpoint = "/api/quotes/stats",
  documentLabel = "devis",
}: QuoteStatsSelectorProps) {
  const [selectedYear, setSelectedYear] = useState(year);
  const [documents, setDocuments] = useState<HistoryDocument[]>(
    Array.isArray(initialDocuments) ? initialDocuments : [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    getParisYearMonth(new Date()).monthIndex,
  );

  const monthlyDocuments = useMemo(
    () =>
      months.map((month, index) => ({
        month,
        documents: documents.filter(
          (document) =>
            getParisYearMonth(document.createdAt).monthIndex === index,
        ),
      })),
    [documents],
  );

  const monthlyTotals = useMemo(
    () =>
      monthlyDocuments.map(({ month, documents: monthDocuments }) => ({
        month,
        count: monthDocuments.length,
        total: monthDocuments.reduce(
          (sum, document) => sum + document.amountCents,
          0,
        ),
      })),
    [monthlyDocuments],
  );

  const selectedDocuments = monthlyDocuments[selectedMonth]?.documents ?? [];
  const selectedTotal = monthlyTotals[selectedMonth]?.total ?? 0;
  const yearlyTotal = documents.reduce(
    (sum, document) => sum + document.amountCents,
    0,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadDocuments() {
      setIsLoading(true);

      try {
        const response = await fetch(`${statsEndpoint}?year=${selectedYear}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const nextDocuments: HistoryDocument[] = await response.json();
        setDocuments(Array.isArray(nextDocuments) ? nextDocuments : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Impossible de charger l’historique.", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();

    return () => controller.abort();
  }, [selectedYear, statsEndpoint]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="forge-surface rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <label className="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">
          Année
        </label>
        <select
          value={selectedYear}
          onChange={(event) => {
            setSelectedYear(Number(event.target.value));
            setSelectedMonth(0);
          }}
          className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-blue-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
        >
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Total de l’année
        </p>
        <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
          {formatCurrency(yearlyTotal)}
        </p>
      </div>

      <div className="forge-surface rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <label className="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">
          Mois sélectionné
        </label>
        <select
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(Number(event.target.value))}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-blue-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
        >
          {monthlyTotals.map((item, index) => (
            <option key={item.month} value={index}>
              {item.month} {selectedYear} ({item.count})
            </option>
          ))}
        </select>
        <p className="mt-4 text-4xl font-bold text-blue-700 dark:text-blue-400">
          {formatCurrency(selectedTotal)}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {monthlyTotals.map((item, index) => {
          const isSelected = index === selectedMonth;

          return (
            <button
              key={item.month}
              type="button"
              onClick={() => setSelectedMonth(index)}
              aria-pressed={isSelected}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white/70 text-slate-700 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-300"
              }`}
            >
              {item.month} ({item.count})
            </button>
          );
        })}
      </div>

      <section aria-live="polite" className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {months[selectedMonth]} {selectedYear}
          </p>
          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
            {selectedDocuments.length} {documentLabel}
            {documentLabel === "facture" && selectedDocuments.length !== 1
              ? "s"
              : ""}
          </h2>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">
            Chargement de l’historique…
          </p>
        ) : selectedDocuments.length > 0 ? (
          selectedDocuments.map((document) => (
            <Link
              key={document.id}
              href={document.href}
              className="forge-surface block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950"
            >
              <div className="flex min-w-0 flex-col items-start gap-3 min-[380px]:flex-row min-[380px]:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-lg font-semibold text-blue-700 dark:text-blue-400">
                    {document.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {document.reference}
                  </p>
                  {document.clientName ? (
                    <p className="mt-3 text-sm font-semibold text-blue-700 dark:text-blue-400">
                      {document.clientName}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Créé le {formatDate(document.createdAt)}
                  </p>
                </div>

                <div className="shrink-0 text-left min-[380px]:text-right">
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(document.amountCents)}
                  </p>
                  {document.badge ? (
                    <span className="mt-2 inline-flex rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-600 dark:text-pink-300">
                      {document.badge}
                    </span>
                  ) : null}
                  <span className="mt-2 block w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300 min-[380px]:ml-auto">
                    {document.statusLabel}
                  </span>
                  {document.attention ? (
                    <span className="mt-2 block text-xs font-bold text-amber-700 dark:text-amber-300">
                      {document.attention}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">
            Aucun {documentLabel} pour ce mois.
          </p>
        )}
      </section>
    </div>
  );
}
