import Link from "next/link";

import { requireStaff } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireStaff("SUPPORT");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    verifiedUsers,
    onboardedUsers,
    trialActive,
    recentSignups,
    paidUsers,
    clients,
    interventions,
    quotes,
    invoices,
    statusGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.user.count({ where: { onboardingCompleted: true } }),
    prisma.user.count({ where: { trialEndsAt: { gt: now } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({
      where: { subscriptionStatus: { in: ["ACTIVE", "PAID"] } },
    }),
    prisma.client.count(),
    prisma.intervention.count(),
    prisma.quote.count(),
    prisma.invoice.count(),
    prisma.user.groupBy({
      by: ["subscriptionStatus"],
      _count: { _all: true },
      orderBy: { subscriptionStatus: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Link
          href="/admin/users"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Voir les utilisateurs →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Comptes"
          value={totalUsers}
          hint={`${verifiedUsers} vérifiés · ${onboardedUsers} onboardés`}
        />
        <Stat label="Essais en cours" value={trialActive} />
        <Stat label="Abonnements payants" value={paidUsers} />
        <Stat
          label="Inscriptions (7 j)"
          value={recentSignups}
        />
        <Stat label="Clients" value={clients} />
        <Stat label="Interventions" value={interventions} />
        <Stat label="Devis" value={quotes} />
        <Stat label="Factures" value={invoices} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Répartition par statut d'abonnement
        </h2>
        <ul className="mt-3 space-y-1 text-sm">
          {statusGroups.map((group) => (
            <li
              key={group.subscriptionStatus}
              className="flex justify-between border-b border-slate-100 py-1 last:border-0 dark:border-slate-800"
            >
              <span className="font-mono">{group.subscriptionStatus}</span>
              <span className="font-semibold">{group._count._all}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
