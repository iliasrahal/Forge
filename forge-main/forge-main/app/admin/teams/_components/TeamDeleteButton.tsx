"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteTeam } from "@/app/admin/_actions";

export default function TeamDeleteButton({
  organizationId,
  name,
}: {
  organizationId: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
      >
        Supprimer
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={name}
        className="rounded-lg border border-red-300 bg-white px-2 py-1 text-sm outline-none dark:border-red-500/40 dark:bg-slate-950"
      />
      <button
        type="button"
        disabled={pending || value.trim() !== name}
        onClick={() => {
          if (!window.confirm(`Supprimer définitivement l'équipe « ${name} » ?`)) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const formData = new FormData();
            formData.set("confirmName", value);
            const result = await deleteTeam(organizationId, formData);
            if (result.ok) router.refresh();
            else setError(result.error);
          });
        }}
        className="rounded-lg bg-red-600 px-2.5 py-1 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
      >
        {pending ? "…" : "Confirmer"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setValue("");
          setError(null);
        }}
        className="text-sm text-slate-400 hover:text-slate-600"
      >
        Annuler
      </button>
      {error ? (
        <span className="w-full text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}
