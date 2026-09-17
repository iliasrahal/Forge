"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { StatisticsPeriod } from "@/src/lib/statistics";

const OPTIONS: Array<{ value: StatisticsPeriod; label: string }> = [
  { value: "month", label: "Ce mois" },
  { value: "previousMonth", label: "Mois précédent" },
  { value: "year", label: "Cette année" },
  { value: "custom", label: "Personnalisé" },
];

export default function StatisticsFilters({ period, from, to }: { period: StatisticsPeriod; from: string; to: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  function navigate(nextPeriod: StatisticsPeriod, start = customFrom, end = customTo) {
    const params = new URLSearchParams({ period: nextPeriod });
    if (nextPeriod === "custom") {
      params.set("from", start);
      params.set("to", end);
    }
    startTransition(() => router.replace(`/statistics?${params.toString()}`, { scroll: false }));
  }

  return (
    <div className="forge-surface rounded-2xl border border-[var(--forge-border)] p-2.5 sm:p-3" aria-busy={isPending}>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {OPTIONS.map((option) => (
          <button key={option.value} type="button" onClick={() => navigate(option.value)}
            className={`min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition ${period === option.value ? "bg-gradient-to-r from-blue-600 to-fuchsia-500 text-white shadow-sm" : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-surface-hover)]"}`}>
            {option.label}
          </button>
        ))}
      </div>
      {period === "custom" ? (
        <form className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:items-end" onSubmit={(event) => { event.preventDefault(); navigate("custom", customFrom, customTo); }}>
          <label className="min-w-0 text-xs font-semibold text-[var(--forge-text-muted)]">Date de début
            <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-[var(--forge-border)] bg-transparent px-2 text-sm text-[var(--forge-text-primary)]" />
          </label>
          <label className="min-w-0 text-xs font-semibold text-[var(--forge-text-muted)]">Date de fin
            <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-[var(--forge-border)] bg-transparent px-2 text-sm text-[var(--forge-text-primary)]" />
          </label>
          <button type="submit" disabled={isPending || !customFrom || !customTo} className="col-span-2 min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-1">Appliquer</button>
        </form>
      ) : null}
    </div>
  );
}
