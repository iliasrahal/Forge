"use client";

import { useState } from "react";
import type { StatisticsPoint } from "@/src/lib/statistics";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function RevenueChart({ points, mode = "collected" }: { points: StatisticsPoint[]; mode?: "collected" | "comparison" }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...points.flatMap((point) => mode === "comparison" ? [point.billedCents, point.collectedCents] : [point.collectedCents]));
  const width = Math.max(560, points.length * 46);
  const height = 220;
  const pad = 28;
  const usable = height - pad * 2;
  const x = (index: number) => pad + (points.length <= 1 ? 0 : index * (width - pad * 2) / (points.length - 1));
  const y = (value: number) => height - pad - value / max * usable;
  const line = (key: "billedCents" | "collectedCents") => points.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");

  if (!points.some((point) => point.billedCents || point.collectedCents)) {
    return <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[var(--forge-border)] px-5 text-center text-sm text-[var(--forge-text-muted)]">Pas encore assez de données sur cette période.</div>;
  }

  return (
    <div className="overflow-x-auto pb-2" onPointerLeave={() => setActive(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 min-w-[560px] w-full" role="img" aria-label={mode === "comparison" ? "Évolution des montants facturés et encaissés" : "Évolution du chiffre d’affaires encaissé"}>
        {[0, .5, 1].map((ratio) => <line key={ratio} x1={pad} x2={width-pad} y1={height-pad-ratio*usable} y2={height-pad-ratio*usable} stroke="currentColor" className="text-slate-300/40 dark:text-slate-600/40" />)}
        {mode === "comparison" ? <polyline points={line("billedCents")} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /> : null}
        <polyline points={line("collectedCents")} fill="none" stroke="#4c6ef5" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <g key={point.key} onPointerEnter={() => setActive(index)} onPointerDown={() => setActive(index)} tabIndex={0} onFocus={() => setActive(index)}>
            <circle cx={x(index)} cy={y(point.collectedCents)} r="12" fill="transparent" />
            <circle cx={x(index)} cy={y(point.collectedCents)} r="4" fill="#4c6ef5" />
            <text x={x(index)} y={height - 5} textAnchor="middle" className="fill-[var(--forge-text-muted)] text-[10px]">{point.label}</text>
          </g>
        ))}
        {active != null ? (
          <g pointerEvents="none">
            <rect x={Math.min(width - 178, Math.max(4, x(active) - 85))} y="4" width="174" height={mode === "comparison" ? 54 : 36} rx="10" className="fill-slate-950/90 dark:fill-white/95" />
            <text x={Math.min(width - 166, Math.max(16, x(active) - 73))} y="26" className="fill-white text-xs dark:fill-slate-950">Encaissé : {euro.format(points[active].collectedCents / 100)}</text>
            {mode === "comparison" ? <text x={Math.min(width - 166, Math.max(16, x(active) - 73))} y="45" className="fill-white text-xs dark:fill-slate-950">Facturé : {euro.format(points[active].billedCents / 100)}</text> : null}
          </g>
        ) : null}
      </svg>
      {mode === "comparison" ? <div className="flex justify-center gap-5 text-xs font-medium text-[var(--forge-text-muted)]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-500" />Facturé</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />Encaissé</span></div> : null}
    </div>
  );
}
