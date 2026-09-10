"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
  dayStates: Array<{ date: string; startedAt: string | null; completedAt: string | null; report: string | null }>;
  dailyTracking: Array<{ date: string; expenseCents: number; durationMinutes: number }>;
  canWrite: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
});

export default function InterventionDayPlanning({ interventionId, days, tasks, dayStates, dailyTracking, canWrite }: Props) {
  const router = useRouter();
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<DayTask | null>(null);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [deleteDate, setDeleteDate] = useState<string | null>(null);
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

  async function deleteDay() {
    if (!deleteDate) return;
    setPending(true);
    setError("");
    const response = await fetch(`/api/interventions/${interventionId}/days`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: deleteDate }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Impossible de supprimer cette journée.");
      setDeleteDate(null);
      return;
    }
    setDeleteDate(null);
    router.refresh();
  }

  async function saveDayReport(event: FormEvent<HTMLFormElement>, date: string) {
    event.preventDefault();
    const report = String(new FormData(event.currentTarget).get("dayReport") ?? "");
    setPending(true);
    const response = await fetch(`/api/interventions/${interventionId}/days`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, operation: "report", report }),
    });
    setPending(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Impossible d’enregistrer le compte rendu.");
      return;
    }
    setReportDate(null);
    router.refresh();
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
        {days.map((date) => {
          const dailyTasks = tasks.filter((task) => task.date === date);
          const dayState = dayStates.find((state) => state.date === date);
          const tracking = dailyTracking.find((entry) => entry.date === date);
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
                  {dayState?.startedAt && !dayState.completedAt && <button disabled={pending} type="button" onClick={() => updateDay(date, "complete")} className="min-h-10 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Terminer la journée</button>}
                  {dayState?.completedAt && <button type="button" onClick={() => setReportDate(reportDate === date ? null : date)} className="min-h-10 rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">Compte rendu facultatif</button>}
                  <button type="button" onClick={() => { setEditing(null); setOpenDate(openDate === date ? null : date); }} className="min-h-10 rounded-xl border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">Ajouter une tâche</button>
                  <button type="button" onClick={() => { setError(""); setDeleteDate(date); }} className="min-h-10 rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 dark:border-red-900 dark:text-red-400">Supprimer la journée</button>
                </div>}
              </div>
              {dayState?.report && <p className="mt-3 rounded-xl bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Compte rendu de la journée : {dayState.report}</p>}
              {reportDate === date && dayState?.completedAt && (
                <form onSubmit={(event) => saveDayReport(event, date)} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <textarea name="dayReport" defaultValue={dayState.report ?? ""} placeholder="Ce qui a été fait aujourd’hui (facultatif)" className="min-h-20 flex-1 rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70" />
                  <button disabled={pending} className="self-end rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Enregistrer</button>
                </form>
              )}
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
      {deleteDate && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-day-title" className="forge-surface w-full max-w-sm rounded-[2rem] border p-6 text-center">
            <h2 id="delete-day-title" className="text-xl font-bold text-[var(--forge-text-primary)]">Supprimer cette journée du chantier ?</h2>
            <p className="mt-2 capitalize text-sm font-semibold text-[var(--forge-text-primary)]">{dateFormatter.format(new Date(`${deleteDate}T12:00:00Z`))}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--forge-text-secondary)]">Les tâches et le planning de cette journée seront supprimés.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" disabled={pending} onClick={() => setDeleteDate(null)} className="min-h-12 rounded-2xl border border-[var(--forge-border-strong)] px-4 font-semibold text-[var(--forge-text-primary)] disabled:opacity-50">Annuler</button>
              <button type="button" disabled={pending} onClick={() => void deleteDay()} className="min-h-12 rounded-2xl bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">{pending ? "Suppression…" : "Supprimer"}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
