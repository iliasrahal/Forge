"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  changeStaffRole,
  grantStaff,
  revokeStaff,
} from "@/app/admin/_actions";

const ROLES = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];

type Member = {
  userId: string;
  role: string;
  email: string;
  name: string;
  isSelf: boolean;
};

export default function StaffManager({ members }: { members: Member[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Action impossible.");
      else router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <form
        action={(formData) => run(() => grantStaff(formData))}
        className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            E-mail d'un compte existant
          </span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 block w-64 rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-500 dark:text-slate-400">Rôle</span>
          <select
            name="role"
            defaultValue="SUPPORT"
            className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          >
            {ROLES.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Ajouter / mettre à jour
        </button>
      </form>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Compte</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.userId}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-xs text-slate-400">{member.email}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={member.role}
                    disabled={pending || member.isSelf}
                    onChange={(event) =>
                      run(() =>
                        changeStaffRole(member.userId, event.target.value),
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950 disabled:opacity-50"
                  >
                    {ROLES.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  {member.isSelf ? (
                    <span className="text-xs text-slate-400">toi</span>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Retirer l'accès staff de ${member.email} ?`,
                          )
                        ) {
                          run(() => revokeStaff(member.userId));
                        }
                      }}
                      className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                    >
                      Retirer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
