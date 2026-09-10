"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getInterventionDayHistoryKind } from "@/src/lib/intervention-day-deletion";
import { formatInterventionDayReport } from "@/src/lib/intervention-day-report";

type DayTask = {
  id: string;
  date: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  report: string | null;
};

type Props = {
  interventionId: string;
  days: string[];
  tasks: DayTask[];
  dayStates: Array<{ date: string; startedAt: string | null; completedAt: string | null; report: string | null; finalizationStep: string | null }>;
  dailyTracking: Array<{ date: string; expenseCents: number; durationMinutes: number; hasExpenses: boolean; hasWorkTimes: boolean }>;
  canWrite: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
});

export default function InterventionDayPlanning({ interventionId, days, tasks, dayStates, dailyTracking, canWrite }: Props) {
  const router = useRouter();
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<DayTask | null>(null);
  const [deleteDayRequest, setDeleteDayRequest] = useState<{ date: string; hasHistory: boolean } | null>(null);
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayDate, setNewDayDate] = useState("");
  const [removedDays, setRemovedDays] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function mutate(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
    setPending(true);
    setError("");
    const response = await fetch(`/api/interventions/${interventionId}/day-tasks`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Impossible d’enregistrer la modification.");
      return false;
    }
    setOpenDate(null);
    setEditing(null);
    router.refresh();
    return true;
  }

  async function updateDay(date: string, operation: "start" | "complete") {
    setPending(true);
    setError("");
    const response = await fetch(`/api/interventions/${interventionId}/days`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, operation }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Impossible de mettre à jour cette journée.");
      return;
    }
    router.refresh();
  }

  async function addDay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newDayDate) return;
    const dateToAdd = newDayDate;
    setPending(true);
    setError("");
    const response = await fetch(`/api/interventions/${interventionId}/days`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDayDate }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Impossible d’ajouter cette journée.");
      return;
    }
    setRemovedDays((current) => current.filter((date) => date !== dateToAdd));
    setNewDayDate("");
    setShowAddDay(false);
    router.refresh();
  }

  async function deleteDay() {
    if (!deleteDayRequest) return;
    const dateToDelete = deleteDayRequest.date;
    setPending(true);
    setError("");
    const response = await fetch(`/api/interventions/${interventionId}/days`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateToDelete }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Impossible de supprimer cette journée.");
      setDeleteDayRequest(null);
      return;
    }
    setRemovedDays((current) => current.includes(dateToDelete) ? current : [...current, dateToDelete]);
    setDeleteDayRequest(null);
    router.refresh();
  }

  async function beginDayCompletion(date: string, finalizationStep?: string | null) {
    if (finalizationStep === "REPORT_INPUT" || finalizationStep === "REPORT_REVIEW") {
      router.push(`/interventions/${interventionId}/days/${date}/report`);
      return;
    }
    setPending(true);
    setError("");
    const response = await fetch(`/api/interventions/${interventionId}/days`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, operation: "beginCompletion" }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Impossible de terminer cette journée.");
      return;
    }
    router.push(`/interventions/${interventionId}/days/${date}/report`);
  }

  async function submit(event: FormEvent<HTMLFormElement>, date: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutate(editing ? "PATCH" : "POST", {
      ...(editing ? { taskId: editing.id } : {}),
      date,
      title: form.get("title"),
      description: form.get("description"),
      startTime: form.get("startTime"),
      report: form.get("report"),
    });
  }

  return (
    <section className="mx-auto mt-8 max-w-2xl">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-[-0.03em] text-blue-700 dark:text-blue-400">Planning du chantier</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Les journées peuvent être suivies séparément sans terminer tout le chantier.</p>
      </div>
      {error && <p className="mt-4 text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-5 space-y-3">
        {days.filter((date) => !removedDays.includes(date)).map((date) => {
          const dailyTasks = tasks.filter((task) => task.date === date);
          const dayState = dayStates.find((state) => state.date === date);
          const tracking = dailyTracking.find((entry) => entry.date === date);
          const dayHistoryKind = getInterventionDayHistoryKind({
            startedAt: dayState?.startedAt,
            completedAt: dayState?.completedAt,
            report: dayState?.report,
            hasExpenses: tracking?.hasExpenses ?? false,
            hasWorkTimes: tracking?.hasWorkTimes ?? false,
            tasks: dailyTasks,
          });
          const showForm = openDate === date || editing?.date === date;
          return (
            <article key={date} className="flex min-h-48 flex-col rounded-2xl border border-blue-200/70 bg-white/45 p-4 dark:border-blue-800/60 dark:bg-slate-900/35 sm:p-5">
              <div className="grid flex-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:gap-6">
                <div className="min-w-0">
                  <h3 className="font-semibold capitalize text-slate-900 dark:text-white">{dateFormatter.format(new Date(`${date}T12:00:00Z`))}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">{dayState?.completedAt ? "Journée terminée" : dayState?.startedAt ? "Journée en cours" : "Journée planifiée"}</p>
                  {tracking && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{Math.floor(tracking.durationMinutes / 60)}h{String(tracking.durationMinutes % 60).padStart(2, "0")} · {(tracking.expenseCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} de dépenses</p>}
                  {dailyTasks.length ? (
                <div className="mt-4 space-y-2">
                  {dailyTasks.map((task) => (
                    <div key={task.id} className="rounded-xl bg-white/55 px-3 py-3 dark:bg-slate-800/55">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium text-slate-800 dark:text-slate-100 ${task.completedAt ? "line-through opacity-60" : ""}`}>{task.startTime ? `${task.startTime} · ` : ""}{task.title}</p>
                          {task.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>}
                          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${task.completedAt ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}`}>
                            {task.completedAt ? "Tâche terminée" : "Tâche planifiée"}
                          </span>
                          {task.report && <p className="mt-2 text-sm italic text-slate-500 dark:text-slate-400">Compte rendu : {task.report}</p>}
                        </div>
                        {canWrite && <div className="flex flex-wrap justify-end gap-2 text-xs font-semibold">
                          {!task.completedAt && <button type="button" onClick={() => mutate("PATCH", { taskId: task.id, completed: true })} className="text-emerald-700 dark:text-emerald-300">Terminer la tâche</button>}
                          <button type="button" onClick={() => { setOpenDate(null); setEditing(task); }} className="text-blue-700 dark:text-blue-300">{task.completedAt ? "Compte rendu / Modifier" : "Modifier"}</button>
                          <button type="button" onClick={() => mutate("DELETE", { taskId: task.id })} className="text-red-600 dark:text-red-400">Supprimer</button>
                        </div>}
                      </div>
                    </div>
                  ))}
                </div>
                  ) : <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Aucun détail prévu pour cette journée.</p>}
                </div>
                {canWrite && <div className="grid w-full shrink-0 grid-cols-1 gap-2 self-start">
                  {!dayState?.startedAt && <button disabled={pending} type="button" onClick={() => updateDay(date, "start")} className="min-h-10 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Commencer la journée</button>}
                  {dayState?.startedAt && !dayState.completedAt && <button disabled={pending} type="button" onClick={() => void beginDayCompletion(date, dayState.finalizationStep)} className="min-h-10 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{dayState.finalizationStep === "REPORT_INPUT" || dayState.finalizationStep === "REPORT_REVIEW" ? "Reprendre la finalisation" : "Terminer la journée"}</button>}
                  <button type="button" onClick={() => { setEditing(null); setOpenDate(openDate === date ? null : date); }} className="min-h-10 rounded-xl border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">Ajouter une tâche</button>
                  <button type="button" onClick={() => {
                    setError("");
                    setDeleteDayRequest({ date, hasHistory: Boolean(dayHistoryKind) });
                  }} className="min-h-10 rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 dark:border-red-900 dark:text-red-400">
                    Supprimer la journée
                  </button>
                </div>}
              </div>
              {dayState?.report && <p className="mt-3 rounded-xl bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Compte rendu de la journée : {formatInterventionDayReport(dayState.report)}</p>}
              {showForm && canWrite && (
                <form onSubmit={(event) => submit(event, date)} className="mt-4 grid gap-3 rounded-xl border border-blue-200/60 p-3 dark:border-blue-800/60 sm:grid-cols-2">
                  <input name="title" required defaultValue={editing?.title ?? ""} placeholder="Tâche" className="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
                  <input name="startTime" type="time" defaultValue={editing?.startTime ?? ""} className="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
                  <textarea name="description" defaultValue={editing?.description ?? ""} placeholder="Description facultative" className="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70 sm:col-span-2" />
                  <textarea name="report" defaultValue={editing?.report ?? ""} placeholder="Compte rendu de la journée (facultatif)" className="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70 sm:col-span-2" />
                  <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => { setOpenDate(null); setEditing(null); }} className="px-3 py-2 text-sm">Annuler</button><button disabled={pending} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Enregistrer</button></div>
                </form>
              )}
            </article>
          );
        })}
      </div>
      {canWrite ? (
        <div className="mt-4 flex flex-col items-center">
          {showAddDay ? (
            <form onSubmit={addDay} className="forge-surface grid w-full max-w-md gap-3 rounded-2xl border p-3 min-[380px]:grid-cols-[minmax(0,1fr)_auto_auto] min-[380px]:items-end">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Date de la journée
                <input
                  type="date"
                  required
                  value={newDayDate}
                  onChange={(event) => setNewDayDate(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                />
              </label>
              <button type="button" onClick={() => { setShowAddDay(false); setNewDayDate(""); setError(""); }} className="min-h-10 rounded-xl border border-slate-300 px-3 text-sm font-semibold dark:border-slate-700">Annuler</button>
              <button disabled={pending} className="min-h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Ajout…" : "Ajouter"}</button>
            </form>
          ) : (
            <button type="button" onClick={() => { setError(""); setShowAddDay(true); }} className="min-h-11 rounded-2xl border border-blue-300 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50">
              + Ajouter une journée
            </button>
          )}
        </div>
      ) : null}
      {deleteDayRequest && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-day-title" className="forge-surface w-full max-w-sm rounded-[2rem] border p-6 text-center">
            <h2 id="delete-day-title" className="text-xl font-bold text-[var(--forge-text-primary)]">Supprimer cette journée du chantier ?</h2>
            <p className="mt-2 capitalize text-sm font-semibold text-[var(--forge-text-primary)]">{dateFormatter.format(new Date(`${deleteDayRequest.date}T12:00:00Z`))}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--forge-text-secondary)]">{deleteDayRequest.hasHistory ? "Cette journée contient du temps, des dépenses ou un historique. Ces données liées à cette journée seront également supprimées." : "Les tâches et le planning de cette journée seront supprimés."}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" disabled={pending} onClick={() => setDeleteDayRequest(null)} className="min-h-12 rounded-2xl border border-[var(--forge-border-strong)] px-4 font-semibold text-[var(--forge-text-primary)] disabled:opacity-50">Annuler</button>
              <button type="button" disabled={pending} onClick={() => void deleteDay()} className="min-h-12 rounded-2xl bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">{pending ? "Suppression…" : deleteDayRequest.hasHistory ? "Supprimer définitivement" : "Supprimer"}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
