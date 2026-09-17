"use client";

import { useState } from "react";

type Member = { id: string; name: string };

export default function DayAssignmentSelect({ interventionId, date, initialUserIds, members, disabled }: { interventionId: string; date: string; initialUserIds: string[]; members: Member[]; disabled: boolean }) {
  const [selected, setSelected] = useState(() => new Set(initialUserIds));
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function toggle(userId: string) {
    const active = selected.has(userId);
    setSaving(userId); setError("");
    const response = await fetch(`/api/interventions/${interventionId}/day-assignments`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: active ? "remove" : "add", userId, date }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setSelected(new Set(Array.isArray(data.userIds) ? data.userIds : []));
    else setError(typeof data.error === "string" ? data.error : "Affectation impossible.");
    setSaving(null);
  }
  return <div className="mt-3"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Participants</p><div className="mt-1.5 flex flex-wrap gap-1.5">{members.map((member) => { const active = selected.has(member.id); return <button key={member.id} type="button" disabled={disabled || saving !== null} aria-pressed={active} onClick={() => void toggle(member.id)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold disabled:opacity-60 ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>{member.name}{saving === member.id ? "…" : ""}</button>; })}</div>{error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}</div>;
}
