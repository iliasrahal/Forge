import Link from "next/link";
import {
  Users,
  Sparkles,
  CreditCard,
  UserPlus,
  FolderKanban,
  Wrench,
  FileText,
  ReceiptText,
  ArrowRight,
} from "lucide-react";

import { requireStaff, roleAtLeast } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import { runTeamCleanup } from "./_actions";
import AsyncButton from "./_components/AsyncButton";
import { Card, PageHeader, Stat } from "./_components/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { staff } = await requireStaff("SUPPORT");
  const canRunCleanup = roleAtLeast(staff.role, "ADMIN");

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
      where: { subscriptionStatus: { in: ["ACTIVE", "ACTIVE_PRO"] } },
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

  const teamsInGrace = await prisma.organization.count({
    where: { type: "TEAM", graceExpiresAt: { not: null } },
  });

  const maxStatus = Math.max(
    1,
    ...statusGroups.map((group) => group._count._all),
  );

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la plateforme Forge."
        action={
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Utilisateurs
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Comptes"
          value={totalUsers}
          hint={`${verifiedUsers} vérifiés · ${onboardedUsers} onboardés`}
          icon={Users}
          accent="blue"
        />
        <Stat
          label="Essais en cours"
          value={trialActive}
          icon={Sparkles}
          accent="amber"
        />
        <Stat
          label="Abonnements payants"
          value={paidUsers}
          icon={CreditCard}
          accent="emerald"
        />
        <Stat
          label="Inscriptions · 7 j"
          value={recentSignups}
          icon={UserPlus}
          accent="slate"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Clients" value={clients} icon={FolderKanban} />
        <Stat label="Interventions" value={interventions} icon={Wrench} />
        <Stat label="Devis" value={quotes} icon={FileText} />
        <Stat label="Factures" value={invoices} icon={ReceiptText} />
      </div>

      <Card className="mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Équipes en sursis
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {teamsInGrace === 0
              ? "Aucune équipe en attente de suppression."
              : `${teamsInGrace} équipe(s) sans aucun membre abonné. Elles sont supprimées automatiquement après 14 jours.`}
          </p>
        </div>
        {canRunCleanup ? (
          <AsyncButton action={runTeamCleanup}>
            Lancer le nettoyage maintenant
          </AsyncButton>
        ) : null}
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Répartition par statut d'abonnement
        </h2>
        <ul className="mt-4 space-y-3">
          {statusGroups.map((group) => (
            <li key={group.subscriptionStatus}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {group.subscriptionStatus}
                </span>
                <span className="font-semibold tabular-nums">
                  {group._count._all}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{
                    width: `${(group._count._all / maxStatus) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
