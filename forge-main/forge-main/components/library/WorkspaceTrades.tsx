"use client";

import { useState } from "react";
import { FORGE_TRADES } from "@/src/lib/trades";

export default function WorkspaceTrades({ initialTrades, canWrite }: { initialTrades: string[]; canWrite: boolean }) {
  const [selected, setSelected] = useState(initialTrades);
  const [saved, setSaved] = useState(false);
  function toggle(value: string) { if (canWrite) setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  async function save() { const response = await fetch("/api/workspaces/trades", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tradeSlugs: selected }) }); if (response.ok) setSaved(true); }
  return <section className="mt-5 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-[var(--forge-text-primary)]">Métiers de cet espace</p><p className="text-sm text-[var(--forge-text-secondary)]">Ils priorisent le contenu suggéré sans bloquer le reste du catalogue.</p></div>{canWrite && <button type="button" onClick={() => void save()} className="rounded-xl border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-600">{saved ? "Enregistré" : "Enregistrer"}</button>}</div><div className="mt-3 flex flex-wrap gap-2">{FORGE_TRADES.map((trade) => <button key={trade.value} type="button" disabled={!canWrite} onClick={() => { setSaved(false); toggle(trade.value); }} className={`rounded-full px-3 py-2 text-sm font-semibold ${selected.includes(trade.value) ? "bg-blue-600 text-white" : "border border-[var(--forge-border-strong)] text-[var(--forge-text-secondary)]"}`}>{trade.label}</button>)}</div></section>;
}
