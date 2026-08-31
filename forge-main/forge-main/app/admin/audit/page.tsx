import Link from "next/link";

import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { formatDateTime } from "../_lib/display";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireStaff("ADMIN");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count(),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { email: true } } },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Journal d'audit</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {total} entrées
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Détail</th>
              <th className="px-4 py-3">Cible</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-3 text-slate-500">{log.actor.email}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3">{log.summary ?? "—"}</td>
                <td className="px-4 py-3">
                  {log.targetType === "User" ? (
                    <Link
                      href={`/admin/users/${log.targetId}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {log.targetType}
                    </Link>
                  ) : (
                    <span className="text-slate-500">{log.targetType}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {log.ipAddress ?? "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Aucune action enregistrée.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={`/admin/audit?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            ← Précédent
          </Link>
          <span className="text-slate-500 dark:text-slate-400">
            Page {page} / {pageCount}
          </span>
          <Link
            href={`/admin/audit?page=${page + 1}`}
            aria-disabled={page >= pageCount}
            className={`rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 ${
              page >= pageCount ? "pointer-events-none opacity-40" : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Suivant →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
