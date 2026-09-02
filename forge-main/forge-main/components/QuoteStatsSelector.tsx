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

function formatDateKey(dateKey: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T12:00:00Z`));
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
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [rangeDocuments, setRangeDocuments] = useState<HistoryDocument[]>([]);
  const [appliedRange, setAppliedRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [isRangeLoading, setIsRangeLoading] = useState(false);
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
  const displayedDocuments = appliedRange
    ? rangeDocuments
    : selectedDocuments;
  const displayedLoading = appliedRange ? isRangeLoading : isLoading;

  function resetRange() {
    setRangeStart("");
    setRangeEnd("");
    setRangeError("");
    setRangeDocuments([]);
    setAppliedRange(null);
  }

  async function applyRangeFilter() {
    setRangeError("");

    if (!rangeStart || !rangeEnd) {
      setRangeError("Choisissez une date de début et une date de fin.");
      return;
    }

    if (rangeEnd < rangeStart) {
      setRangeError(
        "La date de fin doit être postérieure ou égale à la date de début.",
      );
      return;
    }

    setIsRangeLoading(true);

    try {
      const searchParams = new URLSearchParams({
        from: rangeStart,
        to: rangeEnd,
      });
      const response = await fetch(`${statsEndpoint}?${searchParams}`);
      const payload = await response.json();

      if (!response.ok) {
        setRangeError(
          typeof payload?.error === "string"
            ? payload.error
            : "Impossible de filtrer cette période.",
        );
        return;
      }

      setRangeDocuments(Array.isArray(payload) ? payload : []);
      setAppliedRange({ from: rangeStart, to: rangeEnd });
    } catch {
      setRangeError("Impossible de filtrer cette période.");
    } finally {
      setIsRangeLoading(false);
    }
  }

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
            setAppliedRange(null);
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
          onChange={(event) => {
            setSelectedMonth(Number(event.target.value));
            setAppliedRange(null);
          }}
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

      <div className="forge-surface rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">
          Rechercher entre deux dates
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Date de début
            <input
              type="date"
              value={rangeStart}
              onChange={(event) => {
                setRangeStart(event.target.value);
                setRangeError("");
              }}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Date de fin
            <input
              type="date"
              value={rangeEnd}
              min={rangeStart || undefined}
              onChange={(event) => {
                setRangeEnd(event.target.value);
                setRangeError("");
              }}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>
        {rangeError ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
            {rangeError}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2">
          <button
            type="button"
            onClick={applyRangeFilter}
            disabled={isRangeLoading}
            className="min-h-12 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isRangeLoading ? "Recherche…" : "Appliquer le filtre"}
          </button>
          <button
            type="button"
            onClick={resetRange}
            disabled={!rangeStart && !rangeEnd && !appliedRange}
            className="min-h-12 rounded-xl border border-blue-600 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {monthlyTotals.map((item, index) => {
          const isSelected = index === selectedMonth;

          return (
            <button
              key={item.month}
              type="button"
              onClick={() => {
                setSelectedMonth(index);
                setAppliedRange(null);
              }}
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
            {appliedRange
              ? `Du ${formatDateKey(appliedRange.from)} au ${formatDateKey(appliedRange.to)}`
              : `${months[selectedMonth]} ${selectedYear}`}
          </p>
          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
            {displayedDocuments.length} {documentLabel}
            {documentLabel === "facture" && displayedDocuments.length !== 1
              ? "s"
              : ""}
          </h2>
        </div>

        {displayedLoading ? (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">
            Chargement de l’historique…
          </p>
        ) : displayedDocuments.length > 0 ? (
          displayedDocuments.map((document) => (
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
            Aucun {documentLabel} {appliedRange ? "sur cette période" : "pour ce mois"}.
          </p>
        )}
      </section>
    </div>
  );
}
