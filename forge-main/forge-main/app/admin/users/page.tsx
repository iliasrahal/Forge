import Link from "next/link";

import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

import AdminSearch from "../_components/AdminSearch";
import {
  formatDate,
  subscriptionSummary,
  userDisplayName,
} from "../_lib/display";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const TONE_CLASSES = {
  green:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireStaff("SUPPORT");

  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, Number(pageParam) || 1);

  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { companyName: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
        staffMembership: { select: { role: true } },
        _count: {
          select: { clients: true, interventions: true },
        },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();

    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {total} compte{total > 1 ? "s" : ""}
        </span>
      </div>

      <AdminSearch placeholder="E-mail, téléphone, nom, société…" />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Compte</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Abonnement</th>
              <th className="px-4 py-3 text-right">Clients</th>
              <th className="px-4 py-3 text-right">Interv.</th>
              <th className="px-4 py-3">Inscrit</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  Aucun résultat.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const sub = subscriptionSummary(user);

                return (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {userDisplayName(user)}
                      </Link>
                      <div className="mt-0.5 flex gap-1.5">
                        {!user.emailVerifiedAt ? (
                          <span className="rounded bg-amber-100 px-1.5 text-xs text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                            non vérifié
                          </span>
                        ) : null}
                        {user.staffMembership ? (
                          <span className="rounded bg-slate-200 px-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {user.staffMembership.role}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <div>{user.email}</div>
                      <div className="text-xs text-slate-400">{user.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONE_CLASSES[sub.tone]}`}
                      >
                        {sub.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {user._count.clients}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {user._count.interventions}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={buildHref(page - 1)}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 ${
              page <= 1
                ? "pointer-events-none opacity-40"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            ← Précédent
          </Link>
          <span className="text-slate-500 dark:text-slate-400">
            Page {page} / {pageCount}
          </span>
          <Link
            href={buildHref(page + 1)}
            aria-disabled={page >= pageCount}
            className={`rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 ${
              page >= pageCount
                ? "pointer-events-none opacity-40"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Suivant →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
