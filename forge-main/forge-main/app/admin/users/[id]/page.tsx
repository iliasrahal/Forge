import Link from "next/link";
import { notFound } from "next/navigation";

import { requireStaff, roleAtLeast } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import {
  formatDate,
  formatDateTime,
  subscriptionSummary,
  userDisplayName,
} from "../../_lib/display";
import StaffToggle from "./_components/StaffToggle";
import UserAdminPanel from "./_components/UserAdminPanel";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { staff, user: viewer } = await requireStaff("SUPPORT");
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      staffMembership: true,
      memberships: {
        include: { organization: { select: { name: true, type: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          clients: true,
          interventions: true,
        },
      },
    },
  });

  if (!user) notFound();

  const [quoteCount, invoiceCount, auditLogs] = await Promise.all([
    prisma.quote.count({ where: { client: { userId: user.id } } }),
    prisma.invoice.count({ where: { client: { userId: user.id } } }),
    prisma.adminAuditLog.findMany({
      where: { targetId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { email: true } } },
    }),
  ]);

  const sub = subscriptionSummary(user);
  const canManage = roleAtLeast(staff.role, "ADMIN");
  const canDelete = roleAtLeast(staff.role, "SUPER_ADMIN");
  const canManageStaff = roleAtLeast(staff.role, "SUPER_ADMIN");
  const trialEndsAtValue = user.trialEndsAt
    ? new Date(user.trialEndsAt).toISOString().slice(0, 10)
    : null;

  const subViews = [
    { href: "clients", label: "Clients", count: user._count.clients },
    {
      href: "interventions",
      label: "Interventions",
      count: user._count.interventions,
    },
    { href: "quotes", label: "Devis", count: quoteCount },
    { href: "invoices", label: "Factures", count: invoiceCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Utilisateurs
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{userDisplayName(user)}</h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold dark:bg-slate-800">
            {sub.label}
          </span>
          {user.staffMembership ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              staff · {user.staffMembership.role}
            </span>
          ) : null}
          {!user.emailVerifiedAt ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              e-mail non vérifié
            </span>
          ) : null}
          {user.mustChangePassword ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
              changement de mot de passe requis
            </span>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <dl className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="E-mail" value={user.email} />
            <Field label="Téléphone" value={user.phone} />
            <Field label="Société" value={user.companyName} />
            <Field label="Métier" value={user.job} />
            <Field label="Mode" value={user.workMode} />
            <Field label="Statut brut" value={user.subscriptionStatus} />
            <Field
              label="Essai jusqu'au"
              value={formatDate(user.trialEndsAt)}
            />
            <Field label="Inscrit le" value={formatDateTime(user.createdAt)} />
            <Field
              label="E-mail vérifié le"
              value={formatDateTime(user.emailVerifiedAt)}
            />
          </dl>
          {canManage ? (
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="ml-4 shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Modifier
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {subViews.map((view) => (
          <Link
            key={view.href}
            href={`/admin/users/${user.id}/${view.href}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {view.label}
            </p>
            <p className="mt-1 text-xl font-bold">{view.count}</p>
          </Link>
        ))}
      </div>

      {user.memberships.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Espaces de travail
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {user.memberships.map((membership) => (
              <li key={membership.id} className="flex justify-between">
                <span>
                  {membership.organization.name}{" "}
                  <span className="text-xs text-slate-400">
                    ({membership.organization.type})
                  </span>
                </span>
                <span className="font-semibold">{membership.role}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canManageStaff ? (
        <StaffToggle
          userId={user.id}
          currentRole={user.staffMembership?.role ?? null}
          isSelf={user.id === viewer.id}
        />
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-bold">Actions</h2>
        <UserAdminPanel
          userId={user.id}
          email={user.email}
          subscriptionStatus={user.subscriptionStatus}
          trialEndsAt={trialEndsAtValue}
          canManage={canManage}
          canDelete={canDelete}
        />
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Historique admin sur ce compte
        </h3>
        {auditLogs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Aucune action enregistrée.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {auditLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-1 last:border-0 dark:border-slate-800"
              >
                <span>
                  <span className="font-mono text-xs text-slate-400">
                    {log.action}
                  </span>{" "}
                  {log.summary}
                </span>
                <span className="text-xs text-slate-400">
                  {log.actor.email} · {formatDateTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
