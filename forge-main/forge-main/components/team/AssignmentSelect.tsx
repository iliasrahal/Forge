"use client";

import { useState } from "react";

type Member = { id: string; name: string };

export default function AssignmentSelect({ interventionId, initialUserId, members, disabled }: { interventionId: string; initialUserId: string | null; members: Member[]; disabled: boolean }) {
  const [value, setValue] = useState(initialUserId ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <label className="mx-auto mt-4 block max-w-sm text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
      Assignée à
      <select
        value={value}
        disabled={disabled || saving}
        onChange={async (event) => {
          const nextValue = event.target.value;
          setSaving(true);
          const response = await fetch(`/api/interventions/${interventionId}/assignment`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedToId: nextValue || null }),
          });
          if (response.ok) setValue(nextValue);
          setSaving(false);
        }}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="">Non attribuée</option>
        {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
      </select>
    </label>
  );
}
