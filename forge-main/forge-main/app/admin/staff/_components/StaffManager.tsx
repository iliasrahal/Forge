"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";

import {
  changeStaffRole,
  grantStaff,
  revokeStaff,
} from "@/app/admin/_actions";
import { Avatar, TableCard, Td, Th } from "@/app/admin/_components/ui";

const ROLES = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];

type Member = {
  userId: string;
  role: string;
  email: string;
  name: string;
  isSelf: boolean;
};

const selectCls =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950";

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
    <div className="space-y-4">
      <form
        action={(formData) => run(() => grantStaff(formData))}
        className="admin-card flex flex-wrap items-end gap-3 p-4"
      >
        <label className="text-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            E-mail d'un compte existant
          </span>
          <input
            name="email"
            type="email"
            required
            className={`mt-1 block w-72 ${selectCls}`}
          />
        </label>
        <label className="text-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Rôle
          </span>
          <select name="role" defaultValue="SUPPORT" className={`mt-1 block ${selectCls}`}>
            {ROLES.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter / mettre à jour
        </button>
      </form>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <TableCard>
        <thead>
          <tr>
            <Th>Compte</Th>
            <Th>Rôle</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.userId}
              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
            >
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} size={34} />
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-slate-400">{member.email}</div>
                  </div>
                </div>
              </Td>
              <Td>
                <select
                  defaultValue={member.role}
                  disabled={pending || member.isSelf}
                  onChange={(event) =>
                    run(() => changeStaffRole(member.userId, event.target.value))
                  }
                  className={selectCls}
                >
                  {ROLES.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </Td>
              <Td className="text-right">
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
              </Td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </div>
  );
}
