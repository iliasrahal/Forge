import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import {
  Badge,
  EmptyRow,
  PageHeader,
  TableCard,
  Td,
  Th,
} from "../_components/ui";
import { formatDateTime } from "../_lib/display";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ACTION_TONE: Record<string, "blue" | "amber" | "red" | "emerald" | "slate"> =
  {
    USER_DELETED: "red",
    STAFF_REVOKED: "red",
    USER_TEMP_PASSWORD_SET: "amber",
    SUBSCRIPTION_CHANGED: "amber",
    STAFF_GRANTED: "emerald",
    STAFF_ROLE_CHANGED: "blue",
    USER_UPDATED: "blue",
    USER_PASSWORD_RESET_EMAIL: "blue",
    USER_DATA_EXPORTED: "slate",
  };

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
    <div>
      <PageHeader
        title="Journal d'audit"
        subtitle={`${total} entrée${total > 1 ? "s" : ""} — chaque action admin est tracée.`}
      />

      <TableCard>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Admin</Th>
            <Th>Action</Th>
            <Th>Détail</Th>
            <Th>Cible</Th>
            <Th>IP</Th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <EmptyRow colSpan={6} label="Aucune action enregistrée." />
          ) : (
            logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
              >
                <Td className="whitespace-nowrap text-slate-500">
                  {formatDateTime(log.createdAt)}
                </Td>
                <Td className="text-slate-500">{log.actor.email}</Td>
                <Td>
                  <Badge tone={ACTION_TONE[log.action] ?? "slate"}>
                    {log.action}
                  </Badge>
                </Td>
                <Td>{log.summary ?? "—"}</Td>
                <Td>
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
                </Td>
                <Td className="text-xs text-slate-400">
                  {log.ipAddress ?? "—"}
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>

      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href={`/admin/audit?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900 ${
              page <= 1
                ? "pointer-events-none opacity-40"
                : "hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Link>
          <span className="text-slate-500 dark:text-slate-400">
            Page {page} / {pageCount}
          </span>
          <Link
            href={`/admin/audit?page=${page + 1}`}
            aria-disabled={page >= pageCount}
            className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900 ${
              page >= pageCount
                ? "pointer-events-none opacity-40"
                : "hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
