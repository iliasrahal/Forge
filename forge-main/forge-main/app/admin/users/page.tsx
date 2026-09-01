import Link from "next/link";
import { ChevronLeft, ChevronRight, MailWarning } from "lucide-react";

import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

import AdminSearch from "../_components/AdminSearch";
import {
  Avatar,
  Badge,
  EmptyRow,
  PageHeader,
  TableCard,
  Td,
  Th,
} from "../_components/ui";
import { formatDate, subscriptionSummary, userDisplayName } from "../_lib/display";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

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
        _count: { select: { clients: true, interventions: true } },
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
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${total} compte${total > 1 ? "s" : ""}`}
        action={<AdminSearch placeholder="E-mail, téléphone, nom, société…" />}
      />

      <TableCard>
        <thead>
          <tr>
            <Th>Compte</Th>
            <Th>Contact</Th>
            <Th>Abonnement</Th>
            <Th className="text-right">Clients</Th>
            <Th className="text-right">Interv.</Th>
            <Th>Inscrit</Th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <EmptyRow colSpan={6} label="Aucun résultat." />
          ) : (
            users.map((user) => {
              const sub = subscriptionSummary(user);
              const name = userDisplayName(user);

              return (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                >
                  <Td>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar name={name} size={36} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                            {name}
                          </span>
                          {!user.emailVerifiedAt ? (
                            <MailWarning className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          ) : null}
                          {user.staffMembership ? (
                            <Badge tone="blue">
                              {user.staffMembership.role}
                            </Badge>
                          ) : null}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-slate-600 dark:text-slate-300">
                    <div className="text-[13px]">{user.email}</div>
                    <div className="text-xs text-slate-400">{user.phone}</div>
                  </Td>
                  <Td>
                    <Badge tone={sub.tone}>{sub.label}</Badge>
                  </Td>
                  <Td className="text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {user._count.clients}
                  </Td>
                  <Td className="text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {user._count.interventions}
                  </Td>
                  <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {formatDate(user.createdAt)}
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableCard>

      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href={buildHref(page - 1)}
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
            href={buildHref(page + 1)}
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
