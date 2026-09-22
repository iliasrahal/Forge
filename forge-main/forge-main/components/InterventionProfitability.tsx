"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/src/lib/intervention-profitability";
import { INTERVENTION_EXPENSE_LABELS } from "@/src/lib/intervention-expenses";
import type { InterventionTerminology } from "@/src/lib/intervention-terminology";

type Metrics = {
  soldRevenueCents: number | null; plannedRevenueCents: number | null; plannedCostCents: number | null; plannedMarginCents: number | null; plannedMarginPercent: number | null;
  plannedMaterialCostCents: number; plannedLaborCostCents: number; plannedLaborMinutes: number;
  billedRevenueCents: number; grossBilledRevenueCents: number; creditedCents: number; collectedRevenueCents: number;
  expenseCents: number; materialsCostCents: number; laborCostCents: number; nonMaterialExpenseCents: number;
  travelCostCents: number; rentalCostCents: number; subcontractingCostCents: number; otherCostCents: number;
  totalCostCents: number | null; totalCostComplete: boolean; laborCostComplete: boolean; materialsCostComplete: boolean;
  workedMinutes: number; actualMarginCents: number | null; actualMarginPercent: number | null;
  costVarianceCents: number | null; laborTimeVarianceMinutes: number | null; marginVarianceCents: number | null;
  timeByMember: Array<{ userId: string; memberName: string; workedMinutes: number; laborCostCents: number; costComplete: boolean }>;
};
type Expense = { id: string; date: string; dayDate: string | null; amountCents: number; category: string; supplier: string | null; description: string | null; note?: string | null };
type WorkTime = { id: string; date: string; startedAt: string; endedAt: string | null; durationMinutes: number | null; hourlyCostCents: number | null; memberName: string; isCurrentUser: boolean; note?: string | null };

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const labels: Record<string, string> = INTERVENTION_EXPENSE_LABELS;

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

export default function InterventionProfitability({ interventionId, canWrite, hourlyCostCents, metrics, expenses, workTimes, members = [], terminology }: { interventionId: string; canWrite: boolean; hourlyCostCents: number | null; metrics: Metrics; expenses: Expense[]; workTimes: WorkTime[]; members?: Array<{ id: string; name: string }>; terminology: InterventionTerminology }) {
  const router = useRouter();
  const [form, setForm] = useState<"expense" | "time" | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingTime, setEditingTime] = useState<WorkTime | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const running = workTimes.find((entry) => entry.isCurrentUser && !entry.endedAt);
  const today = todayInParis();
  const euro = (cents: number) => money.format(cents / 100);
  const marginTone = metrics.actualMarginCents === null ? "text-amber-700 dark:text-amber-300" : metrics.actualMarginCents < 0 ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300";

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
    void post({ type: "expense", id: editingExpense?.id, amount: data.get("amount"), category: data.get("category"), supplier: data.get("supplier"), description: data.get("description"), note: data.get("note"), date: data.get("date") }, editingExpense ? "PATCH" : "POST");
  }
  function timeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const hours = Number(data.get("hours")); const minutes = Number(data.get("minutes"));
    void post({ type: editingTime ? "time" : "time-manual", id: editingTime?.id, durationMinutes: hours * 60 + minutes, date: data.get("date"), userId: data.get("userId"), note: data.get("note") }, editingTime ? "PATCH" : "POST");
  }
  async function hourlyCostSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const hourlyCost = new FormData(event.currentTarget).get("hourlyCost"); setPending(true);
    const response = await fetch("/api/workspaces/hourly-cost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hourlyCost }) });
    setPending(false); if (!response.ok) { setError("Impossible d’enregistrer le coût horaire."); return; } router.refresh();
  }

  return <section id="tracking" className="mx-auto mt-8 max-w-2xl scroll-mt-6 rounded-3xl border border-blue-200/70 bg-white/45 p-5 dark:border-blue-800/60 dark:bg-slate-900/35">
    <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Rentabilité</p><h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{terminology.trackingTitle}</h2></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/50"><p className="text-xs font-bold uppercase text-slate-400">Vendu</p><p className="mt-2 text-xl font-bold">{metrics.soldRevenueCents === null ? "Non renseigné" : euro(metrics.soldRevenueCents)}</p><p className="mt-1 text-xs text-slate-500">Devis accepté lié</p></div>
      <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/50"><p className="text-xs font-bold uppercase text-slate-400">Facturé</p><p className="mt-2 text-xl font-bold">{euro(metrics.billedRevenueCents)}</p>{metrics.creditedCents > 0 && <p className="mt-1 text-xs text-slate-500">Après {euro(metrics.creditedCents)} d’avoirs émis</p>}</div>
      <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/50"><p className="text-xs font-bold uppercase text-slate-400">Encaissé</p><p className="mt-2 text-xl font-bold">{euro(metrics.collectedRevenueCents)}</p><p className="mt-1 text-xs text-slate-500">Paiements réussis, remboursements déduits</p></div>
      <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/50"><p className="text-xs font-bold uppercase text-slate-400">Coûts réels</p><p className="mt-2 text-xl font-bold">{metrics.totalCostCents === null ? "Incomplets" : euro(metrics.totalCostCents)}</p><p className="mt-1 text-xs text-slate-500">Matériel {euro(metrics.materialsCostCents)} · Main-d’œuvre {euro(metrics.laborCostCents)} · Autres {euro(metrics.nonMaterialExpenseCents)}</p></div>
      <div className="rounded-2xl bg-white/60 p-4 dark:bg-slate-800/50 sm:col-span-2"><p className="text-xs font-bold uppercase text-slate-400">Marge estimée</p><p className={`mt-2 text-xl font-bold ${marginTone}`}>{metrics.actualMarginCents === null ? "Données incomplètes" : `${euro(metrics.actualMarginCents)}${metrics.actualMarginPercent === null ? "" : ` · ${metrics.actualMarginPercent.toLocaleString("fr-FR")} %`}`}</p>{!metrics.laborCostComplete && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Coût horaire manquant ou temps encore en cours.</p>}{!metrics.materialsCostComplete && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Coût réel manquant pour un ou plusieurs matériaux.</p>}</div>
    </div>
    {(metrics.plannedRevenueCents !== null || metrics.timeByMember.length > 0) && <details className="mt-4 rounded-2xl bg-white/45 p-4 dark:bg-slate-800/35"><summary className="cursor-pointer font-semibold text-blue-700 dark:text-blue-300">Prévu vs réel et détail des coûts</summary><div className="mt-3 grid gap-4 text-sm sm:grid-cols-2"><div><p className="font-semibold">Prévu au devis</p><p>Coûts : {metrics.plannedCostCents === null ? "Non renseignés" : euro(metrics.plannedCostCents)}</p><p>Matériel : {euro(metrics.plannedMaterialCostCents)}</p><p>Main-d’œuvre : {euro(metrics.plannedLaborCostCents)}{metrics.plannedLaborMinutes > 0 ? ` · ${formatDuration(metrics.plannedLaborMinutes)}` : ""}</p>{metrics.plannedMarginCents !== null && <p>Marge : {euro(metrics.plannedMarginCents)}{metrics.plannedMarginPercent !== null ? ` · ${metrics.plannedMarginPercent.toLocaleString("fr-FR")} %` : ""}</p>}</div><div><p className="font-semibold">Réel</p><p>Matériel : {euro(metrics.materialsCostCents)}</p><p>Déplacement : {euro(metrics.travelCostCents)}</p><p>Location : {euro(metrics.rentalCostCents)}</p><p>Sous-traitance : {euro(metrics.subcontractingCostCents)}</p><p>Autre : {euro(metrics.otherCostCents)}</p>{metrics.costVarianceCents !== null && <p>Écart de coûts : {euro(metrics.costVarianceCents)}</p>}{metrics.laborTimeVarianceMinutes !== null && <p>Écart de temps : {metrics.laborTimeVarianceMinutes >= 0 ? "+" : "−"}{formatDuration(Math.abs(metrics.laborTimeVarianceMinutes))}</p>}</div></div>{metrics.timeByMember.length > 0 && <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700"><p className="font-semibold">Temps par membre</p>{metrics.timeByMember.map((member) => <p key={member.userId} className="text-sm">{member.memberName} · {formatDuration(member.workedMinutes)}{member.costComplete ? ` · ${euro(member.laborCostCents)}` : " · coût incomplet"}</p>)}</div>}</details>}
    {metrics.marginVarianceCents !== null && <p className="mt-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Écart sur la marge prévue : {euro(metrics.marginVarianceCents)}</p>}
    {canWrite && <form onSubmit={hourlyCostSubmit} className="mx-auto mt-4 flex max-w-sm items-end gap-2"><label className="flex-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Mon coût horaire interne (€)<input name="hourlyCost" type="number" min="0" step="0.01" defaultValue={hourlyCostCents === null ? "" : hourlyCostCents / 100} className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-slate-900/70"/></label><button disabled={pending} className="rounded-full border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">Enregistrer</button></form>}
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {canWrite && <><button onClick={() => { setEditingExpense(null); setForm(form === "expense" ? null : "expense"); }} className="rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">+ Ajouter une dépense</button><button onClick={() => { setEditingTime(null); setForm(form === "time" ? null : "time"); }} className="rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">+ Ajouter du temps</button><button disabled={pending} onClick={() => post({ type: running ? "time-stop" : "time-start", date: today })} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{running ? "■ Terminer le temps" : "▶ Commencer le temps"}</button></>}
    </div>
    {error && <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
    {form === "expense" && <form onSubmit={expenseSubmit} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2"><input required name="amount" inputMode="decimal" defaultValue={editingExpense ? editingExpense.amountCents / 100 : ""} placeholder="Montant (€)" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><select name="category" defaultValue={editingExpense?.category ?? "MATERIALS"} className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70">{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><input required name="date" type="date" defaultValue={editingExpense?.date ?? today} className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input name="supplier" defaultValue={editingExpense?.supplier ?? ""} placeholder="Fournisseur" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><textarea name="description" defaultValue={editingExpense?.description ?? ""} placeholder="Libellé / description" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><textarea name="note" defaultValue={editingExpense?.note ?? ""} placeholder="Note facultative" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><button disabled={pending} className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white sm:col-span-2">Enregistrer</button></form>}
    {form === "time" && <form onSubmit={timeSubmit} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3"><input required name="date" type="date" defaultValue={editingTime?.date ?? today} className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/>{members.length > 0 && !editingTime && <select name="userId" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70">{members.map((member)=><option key={member.id} value={member.id}>{member.name}</option>)}</select>}<input required name="hours" type="number" min="0" max="24" defaultValue={editingTime?.durationMinutes ? Math.floor(editingTime.durationMinutes / 60) : ""} placeholder="Heures" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input required name="minutes" type="number" min="0" max="59" defaultValue={editingTime?.durationMinutes ? editingTime.durationMinutes % 60 : 0} placeholder="Minutes" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input name="note" defaultValue={editingTime?.note ?? ""} placeholder="Note facultative" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70 sm:col-span-2"/><button disabled={pending} className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white sm:col-span-3">Enregistrer</button></form>}
    <div className="mt-6 grid gap-5 sm:grid-cols-2"><div><h3 className="font-bold">Temps passé · {formatDuration(metrics.workedMinutes)}</h3><div className="mt-2 space-y-2">{workTimes.map((entry)=><div key={entry.id} className="rounded-xl bg-white/55 p-3 text-sm dark:bg-slate-800/55"><p className="font-semibold">{entry.date} — {entry.memberName}</p><p>{entry.durationMinutes === null ? "En cours" : formatDuration(entry.durationMinutes)}</p>{canWrite && entry.durationMinutes !== null && <button onClick={()=>{setEditingTime(entry);setForm("time");}} className="mr-3 mt-1 text-xs font-semibold text-blue-600">Modifier</button>}{canWrite && <button onClick={()=>remove("time",entry.id)} className="mt-1 text-xs font-semibold text-red-600">Supprimer</button>}</div>)}</div></div><div><h3 className="font-bold">Dépenses</h3><div className="mt-2 space-y-2">{expenses.map((expense)=><div key={expense.id} className="rounded-xl bg-white/55 p-3 text-sm dark:bg-slate-800/55"><p className="font-semibold">{expense.date} — {labels[expense.category] ?? "Autre"} — {euro(expense.amountCents)}</p>{expense.supplier && <p>{expense.supplier}</p>}{expense.description && <p className="text-slate-500">{expense.description}</p>}{canWrite && <button onClick={()=>{setEditingExpense(expense);setForm("expense");}} className="mr-3 mt-1 text-xs font-semibold text-blue-600">Modifier</button>}{canWrite && <button onClick={()=>remove("expense",expense.id)} className="mt-1 text-xs font-semibold text-red-600">Supprimer</button>}</div>)}</div></div></div>
  </section>;
}
