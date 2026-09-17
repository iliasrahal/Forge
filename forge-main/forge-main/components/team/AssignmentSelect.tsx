"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = { id: string; name: string };

export default function AssignmentSelect({ interventionId, initialUserIds, members, disabled }: { interventionId: string; initialUserIds: string[]; members: Member[]; disabled: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(initialUserIds));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggle(userId: string) {
    const wasSelected = selected.has(userId);
    setSavingId(userId);
    setError("");
    const response = await fetch(`/api/interventions/${interventionId}/assignment`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: wasSelected ? "remove" : "add", userId }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setSelected(new Set(Array.isArray(data.userIds) ? data.userIds : []));
      router.refresh();
    } else setError(typeof data.error === "string" ? data.error : "Affectation impossible.");
    setSavingId(null);
  }

  return (
    <section className="mx-auto mt-4 max-w-lg text-center">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Équipe affectée</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {members.map((member) => { const active = selected.has(member.id); return <button key={member.id} type="button" disabled={disabled || savingId !== null} aria-pressed={active} onClick={() => void toggle(member.id)} className={`min-h-10 rounded-full border px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"}`}>{member.name}{savingId === member.id ? "…" : ""}</button>; })}
      </div>
      {!selected.size ? <p className="mt-2 text-xs text-slate-500">Personne pour le moment</p> : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </section>
  );
}
