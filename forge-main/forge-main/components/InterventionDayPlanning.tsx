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
  canWrite: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
});

export default function InterventionDayPlanning({ interventionId, days, tasks, canWrite }: Props) {
  const router = useRouter();
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<DayTask | null>(null);
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
          const showForm = openDate === date || editing?.date === date;
          return (
            <article key={date} className="rounded-2xl border border-blue-200/70 bg-white/45 p-4 dark:border-blue-800/60 dark:bg-slate-900/35">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold capitalize text-slate-900 dark:text-white">{dateFormatter.format(new Date(`${date}T12:00:00Z`))}</h3>
                {canWrite && <button type="button" onClick={() => { setEditing(null); setOpenDate(openDate === date ? null : date); }} className="rounded-full border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">Ajouter une tâche</button>}
              </div>
              {dailyTasks.length ? (
                <div className="mt-3 space-y-2">
                  {dailyTasks.map((task) => (
                    <div key={task.id} className="rounded-xl bg-white/55 px-3 py-3 dark:bg-slate-800/55">
                      <div className="flex items-start gap-3">
                        {canWrite && <input aria-label={`Terminer ${task.title}`} type="checkbox" checked={Boolean(task.completedAt)} onChange={() => mutate("PATCH", { taskId: task.id, completed: !task.completedAt })} className="mt-1 size-4 accent-blue-600" />}
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium text-slate-800 dark:text-slate-100 ${task.completedAt ? "line-through opacity-60" : ""}`}>{task.startTime ? `${task.startTime} · ` : ""}{task.title}</p>
                          {task.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>}
                        </div>
                        {canWrite && <div className="flex gap-2 text-xs font-semibold"><button type="button" onClick={() => { setOpenDate(null); setEditing(task); }} className="text-blue-700 dark:text-blue-300">Modifier</button><button type="button" onClick={() => mutate("DELETE", { taskId: task.id })} className="text-red-600 dark:text-red-400">Supprimer</button></div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucun détail prévu pour cette journée.</p>}
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
    </section>
  );
}
