"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Task = { id: string; title: string; description: string | null; status: string; assignedToId: string | null; assigneeName: string | null };
type Member = { id: string; name: string };
type Material = { id: string; name: string; brand: string | null; reference: string | null; unit: string; defaultPurchasePriceCents: number | null };
type PurchaseLine = { id: string; name: string; brand: string | null; reference: string | null; unit: string; unitPriceCents: number; availableQuantity: number };
type Usage = { id: string; name: string; brand: string | null; reference: string | null; quantity: number; unit: string; actualUnitCostCents: number | null; dayDate: string | null };

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function InterventionOperations({ interventionId, canWrite, progressPercent, progressSource, generalTasks, members, materials, purchaseLines, usages }: {
  interventionId: string;
  canWrite: boolean;
  progressPercent: number | null;
  progressSource: "explicit" | "tasks" | "days" | null;
  generalTasks: Task[];
  members: Member[];
  materials: Material[];
  purchaseLines: PurchaseLine[];
  usages: Usage[];
}) {
  const router = useRouter();
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function request(url: string, method: string, body: Record<string, unknown>) {
    setPending(true); setError("");
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok && data.code === "STOCK_INSUFFICIENT" && window.confirm(`${data.error} Continuer et laisser le stock devenir négatif ?`)) {
      setPending(false);
      return request(url, method, { ...body, confirmInsufficientStock: true });
    }
    if (!response.ok) { setError(typeof data.error === "string" ? data.error : "Impossible d’enregistrer."); return false; }
    router.refresh(); return true;
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const success = await request(`/api/interventions/${interventionId}/day-tasks`, editingTask ? "PATCH" : "POST", { taskId: editingTask?.id, date: null, title: data.get("title"), description: data.get("description"), assignedToId: data.get("assignedToId") });
    if (success) { setTaskOpen(false); setEditingTask(null); }
  }

  async function addMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const selectedId = String(data.get("materialCatalogItemId") ?? "");
    const purchaseLineId = String(data.get("purchaseLineId") ?? "");
    const selected = materials.find((item) => item.id === selectedId);
    const purchased = purchaseLines.find((item) => item.id === purchaseLineId);
    const success = await request(`/api/interventions/${interventionId}/materials`, "POST", {
      materialCatalogItemId: selectedId || null,
      purchaseLineId: purchaseLineId || null,
      name: data.get("name") || purchased?.name || selected?.name,
      quantity: data.get("quantity"), unit: data.get("unit") || purchased?.unit || selected?.unit,
      actualUnitCost: purchased ? purchased.unitPriceCents / 100 : data.get("actualUnitCost"), date: data.get("date"), note: data.get("note"),
    });
    if (success) setMaterialOpen(false);
  }

  async function updateProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await request(`/api/interventions/${interventionId}/progress`, "PATCH", { percent: data.get("percent") });
  }

  async function editUsage(usage: Usage) {
    const value = window.prompt(`Nouvelle quantité (${usage.unit})`, String(usage.quantity));
    if (value === null) return;
    await request(`/api/interventions/${interventionId}/materials`, "PATCH", { id: usage.id, quantity: value, requestKey: crypto.randomUUID() });
  }

  return <section className="mx-auto mt-8 max-w-2xl space-y-5">
    <nav className="grid grid-cols-3 gap-2 rounded-2xl border border-blue-200/70 bg-white/45 p-2 text-center text-xs font-semibold text-blue-700 dark:border-blue-800/60 dark:bg-slate-900/35 dark:text-blue-300 sm:grid-cols-6">
      <a href="#planning">Planning</a><a href="#tasks">Tâches</a><a href="#tracking">Temps</a><a href="#tracking">Dépenses</a><a href="#materials">Matériaux</a><a href="#documents">Documents</a>
    </nav>
    <section id="tasks" className="scroll-mt-6 rounded-3xl border border-blue-200/70 bg-white/45 p-5 dark:border-blue-800/60 dark:bg-slate-900/35">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950 dark:text-white">Tâches générales</h2><p className="text-sm text-slate-500">À organiser maintenant ou à affecter plus tard à une journée.</p></div>{canWrite && <button onClick={() => { setEditingTask(null); setTaskOpen(!taskOpen); }} className="rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">+ Ajouter</button>}</div>
      {progressPercent !== null && <p className="mt-3 text-xs text-slate-500">Progression {progressSource === "explicit" ? "renseignée" : progressSource === "tasks" ? "calculée sur les tâches" : "calculée sur les journées"} : {progressPercent} %</p>}
      {canWrite && <form onSubmit={updateProgress} className="mt-3 flex flex-wrap items-end gap-2"><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Avancement explicite (%)<input name="percent" type="number" min="0" max="100" defaultValue={progressSource === "explicit" ? progressPercent ?? "" : ""} placeholder="Automatique" className="mt-1 block w-32 rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-slate-900/70"/></label><button disabled={pending} className="rounded-full border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">Appliquer</button><button type="button" onClick={() => request(`/api/interventions/${interventionId}/progress`, "PATCH", { percent: null })} className="px-2 py-2 text-xs font-semibold text-slate-500">Calcul automatique</button></form>}
      {taskOpen && <form key={editingTask?.id ?? "new"} onSubmit={addTask} className="mt-4 grid gap-3 sm:grid-cols-2"><input name="title" required defaultValue={editingTask?.title ?? ""} placeholder="Titre de la tâche" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><textarea name="description" defaultValue={editingTask?.description ?? ""} placeholder="Description facultative" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/>{members.length > 0 && <select name="assignedToId" defaultValue={editingTask?.assignedToId ?? ""} className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"><option value="">Non affectée</option>{members.map((member)=><option key={member.id} value={member.id}>{member.name}</option>)}</select>}<div className="flex gap-2"><button type="button" onClick={() => { setTaskOpen(false); setEditingTask(null); }} className="rounded-full border px-4 py-2 font-semibold">Annuler</button><button disabled={pending} className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white">{editingTask ? "Enregistrer" : "Ajouter la tâche"}</button></div></form>}
      <div className="mt-4 space-y-2">{generalTasks.length ? generalTasks.map((task) => <article key={task.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/60 p-3 dark:bg-slate-800/50"><div className="min-w-0 flex-1"><p className={`font-semibold ${task.status === "DONE" ? "line-through opacity-60" : ""}`}>{task.title}</p>{task.description && <p className="text-sm text-slate-500">{task.description}</p>}{task.assigneeName && <p className="text-xs text-blue-600">{task.assigneeName}</p>}</div>{canWrite && <div className="flex flex-wrap gap-2 text-xs font-semibold"><button onClick={() => { setEditingTask(task); setTaskOpen(true); }} className="text-blue-600">Modifier</button>{task.status !== "IN_PROGRESS" && task.status !== "DONE" && <button onClick={() => request(`/api/interventions/${interventionId}/day-tasks`, "PATCH", { taskId: task.id, status: "IN_PROGRESS" })} className="text-amber-600">Commencer</button>}{task.status !== "DONE" ? <button onClick={() => request(`/api/interventions/${interventionId}/day-tasks`, "PATCH", { taskId: task.id, status: "DONE" })} className="text-emerald-600">Terminer</button> : <button onClick={() => request(`/api/interventions/${interventionId}/day-tasks`, "PATCH", { taskId: task.id, status: "TODO" })} className="text-blue-600">Réouvrir</button>}<button onClick={() => request(`/api/interventions/${interventionId}/day-tasks`, "DELETE", { taskId: task.id })} className="text-red-600">Supprimer</button></div>}</article>) : <p className="text-sm text-slate-500">Aucune tâche générale.</p>}</div>
    </section>
    <section id="materials" className="scroll-mt-6 rounded-3xl border border-blue-200/70 bg-white/45 p-5 dark:border-blue-800/60 dark:bg-slate-900/35">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950 dark:text-white">Matériaux utilisés</h2><p className="text-sm text-slate-500">Usage réel du chantier, distinct des achats et dépenses.</p></div>{canWrite && <button onClick={() => setMaterialOpen(!materialOpen)} className="rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-700 dark:text-blue-300">+ Ajouter</button>}</div>
      {materialOpen && <form onSubmit={addMaterial} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">{purchaseLines.length>0&&<select name="purchaseLineId" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70 sm:col-span-2"><option value="">Sans ligne d’achat</option>{purchaseLines.map((item)=><option key={item.id} value={item.id}>{item.name} · {item.availableQuantity.toLocaleString("fr-FR")} {item.unit} disponible</option>)}</select>}<select name="materialCatalogItemId" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"><option value="">Ligne libre</option>{materials.map((item)=><option key={item.id} value={item.id}>{[item.name,item.brand,item.reference].filter(Boolean).join(" · ")}</option>)}</select><input name="name" placeholder="Désignation si ligne libre" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input name="quantity" required type="number" min="0.001" step="0.001" defaultValue="1" placeholder="Quantité" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input name="unit" defaultValue="u" placeholder="Unité" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input name="actualUnitCost" type="number" min="0" step="0.01" placeholder="Coût unitaire réel (€)" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><input name="date" type="date" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70"/><textarea name="note" placeholder="Note facultative" className="min-w-0 rounded-xl border bg-white/70 px-3 py-2 dark:bg-slate-900/70 sm:col-span-2"/><button disabled={pending} className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white sm:col-span-2">Enregistrer l’utilisation</button></form>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{usages.length ? usages.map((usage)=><article key={usage.id} className="rounded-2xl bg-white/60 p-3 dark:bg-slate-800/50"><p className="font-semibold">{usage.name}</p><p className="text-sm text-slate-500">{[usage.brand,usage.reference].filter(Boolean).join(" · ") || "Ligne libre"}</p><p className="text-sm">{usage.quantity.toLocaleString("fr-FR")} {usage.unit}{usage.actualUnitCostCents !== null ? ` · ${money.format(usage.actualUnitCostCents / 100)} / ${usage.unit}` : ""}</p>{canWrite && <div className="mt-2 flex gap-3 text-xs font-semibold"><button onClick={() => editUsage(usage)} className="text-blue-600">Modifier</button><button onClick={() => request(`/api/interventions/${interventionId}/materials`, "DELETE", { id: usage.id })} className="text-red-600">Supprimer</button></div>}</article>) : <p className="text-sm text-slate-500">Aucun matériel utilisé renseigné.</p>}</div>
    </section>
    {error && <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
  </section>;
}
