"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setUserStaffRole } from "@/app/admin/_actions";

const ROLES = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];

export default function StaffToggle({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: string | null;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState(currentRole ?? "SUPPORT");
  const [message, setMessage] = useState<string | null>(null);

  const apply = (nextRole: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await setUserStaffRole(userId, nextRole);
      if (result.ok) {
        router.refresh();
      } else {
        setMessage(result.error);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        Accès back-office
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={role}
          disabled={pending}
          onChange={(event) => setRole(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          {ROLES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <button
          type="button"
          disabled={pending}
          onClick={() => apply(role)}
          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {currentRole ? "Changer le rôle" : "Nommer staff"}
        </button>

        {currentRole ? (
          <button
            type="button"
            disabled={pending || isSelf}
            onClick={() => {
              if (window.confirm("Retirer l'accès back-office de ce compte ?")) {
                apply("NONE");
              }
            }}
            className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-500/40 dark:hover:bg-red-500/10"
          >
            Retirer l'accès
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {currentRole
          ? `Actuellement : ${currentRole}.`
          : "Ce compte n'a pas accès au back-office."}
        {isSelf ? " (c'est toi)" : ""}
      </p>

      {message ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>
      ) : null}
    </div>
  );
}
