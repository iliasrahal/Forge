"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/src/lib/intervention-profitability";

type Metrics = {
  plannedRevenueCents: number | null; plannedCostCents: number | null; plannedMarginCents: number | null;
  billedRevenueCents: number; collectedRevenueCents: number; expenseCents: number; laborCostCents: number;
  workedMinutes: number; actualMarginCents: number; marginVarianceCents: number | null;
};
type Expense = { id: string; date: string; dayDate: string | null; amountCents: number; category: string; supplier: string | null; description: string | null };
type WorkTime = { id: string; date: string; startedAt: string; endedAt: string | null; durationMinutes: number | null; hourlyCostCents: number | null; memberName: string; isCurrentUser: boolean };

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const labels: Record<string, string> = { MATERIALS: "Matériaux", SUPPLIES: "Fournitures", TRAVEL: "Déplacement", RENTAL: "Location", SUBCONTRACTING: "Sous-traitance", OTHER: "Autre" };

function todayInParis() {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export default function InterventionProfitability({ interventionId, canWrite, hourlyCostCents, metrics, expenses, workTimes }: { interventionId: string; canWrite: boolean; hourlyCostCents: number | null; metrics: Metrics; expenses: Expense[]; workTimes: WorkTime[] }) {
  const router = useRouter();
  const [form, setForm] = useState<"expense" | "time" | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingTime, setEditingTime] = useState<WorkTime | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const running = workTimes.find((entry) => entry.isCurrentUser && !entry.endedAt);
  const today = todayInParis();
  const euro = (cents: number) => money.format(cents / 100);

  async function post(body: Record<string, unknown>, method: "POST" | "PATCH" = "POST") {
    setPending(true); setError("");
    const response = await fetch(`/api/interventions/${interventionId}/tracking`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({})); setPending(false);
    if (!response.ok) { setError(typeof data.error === "string" ? data.error : "Impossible d’enregistrer."); return; }
    setForm(null); setEditingExpense(null); setEditingTime(null); router.refresh();
  }
  async function remove(type: "expense" | "time", id: string) {
    const response = await fetch(`/api/interventions/${interventionId}/tracking`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
    if (response.ok) router.refresh();
  }
  function expenseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    void post({ type: "expense", id: editingExpense?.id, amount: data.get("amount"), category: data.get("category"), supplier: data.get("supplier"), description: data.get("description"), date: data.get("date") }, editingExpense ? "PATCH" : "POST");
  }
  function timeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const hours = Number(data.get("hours")); const minutes = Number(data.get("minutes"));
    void post({ type: editingTime ? "time" : "time-manual", id: editingTime?.id, durationMinutes: hours * 60 + minutes, date: data.get("date") }, editingTime ? "PATCH" : "POST");
  }
  async function hourlyCostSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const hourlyCost = new FormData(event.currentTarget).get("hourlyCost"); setPending(true);
    const response = await fetch("/api/workspaces/hourly-cost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hourlyCost }) });
    setPending(false); if (!response.ok) { setError("Impossible d’enregistrer le coût horaire."); return; } router.refresh();
  }

  return <section className="mx-auto mt-8 max-w-2xl rounded-3xl border border-blue-200/70 bg-white/45 p-5 dark:border-blue-800/60 dark:bg-slate-900/35">
    <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Rentabilité</p><h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Suivi du chantier</h2></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {metrics.plannedRevenueCents !== null && <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/50"><p className="text-xs font-bold uppercase text-slate-400">Prévu</p><p className="mt-2">CA : <strong>{euro(metrics.plannedRevenueCents)}</strong></p>{metrics.plannedCostCents !== null && <p>Coûts : <strong>{euro(metrics.plannedCostCents)}</strong></p>}{metrics.plannedMarginCents !== null && <p>Marge : <strong>{euro(metrics.plannedMarginCents)}</strong></p>}</div>}
      <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/50"><p className="text-xs font-bold uppercase text-slate-400">Réel</p><p className="mt-2">Facturé : <strong>{euro(metrics.billedRevenueCents)}</strong></p><p>Encaissé : <strong>{euro(metrics.collectedRevenueCents)}</strong></p><p>Dépenses : <strong>{euro(metrics.expenseCents)}</strong></p><p>Main-d’œuvre : <strong>{euro(metrics.laborCostCents)}</strong></p><p className="mt-1 text-blue-700 dark:text-blue-300">Marge : <strong>{euro(metrics.actualMarginCents)}</strong></p></div>
    </div>
    {metrics.marginVarianceCents !== null && <p className="mt-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Écart sur la marge prévue : {euro(metrics.marginVarianceCents)}</p>}
    {canWrite && <form onSubmit={hourlyCostSubmit} className="mx-auto mt-4 flex max-w-sm items-end gap-2"><label className="flex-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Mon coût horaire interne (€)<input name="hourlyCost" type="number" min="0" step="0.01" defaultValue={hourlyCostCents === null ? "" : hourlyCostCents / 100} className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-slate-900/70"/></label><button disabled={pending} className="rounded-full border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">Enregistrer</button></form>}
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {canWrite && <><button onClick={() => { setEditingExpense(null); setForm(form === "expense" ? null : "expense"); }} className="rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">+ Ajouter une dépense</button><button onClick={() => { setEditingTime(null); setForm(form === "time" ? null : "time"); }} className="rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">+ Ajouter du temps</button><button disabled={pending} onClick={() => post({ type: running ? "time-stop" : "time-start", date: today })} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{running ? "■ Terminer le temps" : "▶ Commencer le temps"}</button></>}
    </div>
    {error && <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
    {form === "expense" && <form onSubmit={expenseSubmit} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2"><input required name="amount" inputMode="decimal" defaultValue={editingExpense ? editingExpense.amountCents / 100 : ""} placeholder="Montant (€)" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><select name="category" defaultValue={editingExpense?.category ?? "MATERIALS"} className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70">{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><input required name="date" type="date" defaultValue={editingExpense?.date ?? today} className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input name="supplier" defaultValue={editingExpense?.supplier ?? ""} placeholder="Fournisseur" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><textarea name="description" defaultValue={editingExpense?.description ?? ""} placeholder="Description facultative" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70 sm:col-span-2"/><button disabled={pending} className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white sm:col-span-2">Enregistrer</button></form>}
    {form === "time" && <form onSubmit={timeSubmit} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3"><input required name="date" type="date" defaultValue={editingTime?.date ?? today} className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input required name="hours" type="number" min="0" max="24" defaultValue={editingTime?.durationMinutes ? Math.floor(editingTime.durationMinutes / 60) : ""} placeholder="Heures" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input required name="minutes" type="number" min="0" max="59" defaultValue={editingTime?.durationMinutes ? editingTime.durationMinutes % 60 : 0} placeholder="Minutes" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><button disabled={pending} className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white sm:col-span-3">Enregistrer</button></form>}
    <div className="mt-6 grid gap-5 sm:grid-cols-2"><div><h3 className="font-bold">Temps passé · {formatDuration(metrics.workedMinutes)}</h3><div className="mt-2 space-y-2">{workTimes.map((entry)=><div key={entry.id} className="rounded-xl bg-white/55 p-3 text-sm dark:bg-slate-800/55"><p className="font-semibold">{entry.date} — {entry.memberName}</p><p>{entry.durationMinutes === null ? "En cours" : formatDuration(entry.durationMinutes)}</p>{canWrite && entry.durationMinutes !== null && <button onClick={()=>{setEditingTime(entry);setForm("time");}} className="mr-3 mt-1 text-xs font-semibold text-blue-600">Modifier</button>}{canWrite && <button onClick={()=>remove("time",entry.id)} className="mt-1 text-xs font-semibold text-red-600">Supprimer</button>}</div>)}</div></div><div><h3 className="font-bold">Dépenses</h3><div className="mt-2 space-y-2">{expenses.map((expense)=><div key={expense.id} className="rounded-xl bg-white/55 p-3 text-sm dark:bg-slate-800/55"><p className="font-semibold">{expense.date} — {labels[expense.category] ?? "Autre"} — {euro(expense.amountCents)}</p>{expense.supplier && <p>{expense.supplier}</p>}{expense.description && <p className="text-slate-500">{expense.description}</p>}{canWrite && <button onClick={()=>{setEditingExpense(expense);setForm("expense");}} className="mr-3 mt-1 text-xs font-semibold text-blue-600">Modifier</button>}{canWrite && <button onClick={()=>remove("expense",expense.id)} className="mt-1 text-xs font-semibold text-red-600">Supprimer</button>}</div>)}</div></div></div>
  </section>;
}
