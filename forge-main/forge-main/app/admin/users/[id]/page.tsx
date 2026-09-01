import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  FolderKanban,
  Wrench,
  FileText,
  ReceiptText,
  MailWarning,
  KeyRound,
  ChevronRight,
} from "lucide-react";

import { requireStaff, roleAtLeast } from "@/src/lib/admin-auth";
import { prisma } from "@/src/lib/prisma";

import {
  Avatar,
  Badge,
  Card,
  PageHeader,
} from "../../_components/ui";
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
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value || "—"}</dd>
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
      _count: { select: { clients: true, interventions: true } },
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
  const name = userDisplayName(user);
  const canManage = roleAtLeast(staff.role, "ADMIN");
  const canDelete = roleAtLeast(staff.role, "SUPER_ADMIN");
  const canManageStaff = roleAtLeast(staff.role, "SUPER_ADMIN");
  const trialEndsAtValue = user.trialEndsAt
    ? new Date(user.trialEndsAt).toISOString().slice(0, 10)
    : null;

  const subViews = [
    { href: "clients", label: "Clients", count: user._count.clients, icon: FolderKanban },
    { href: "interventions", label: "Interventions", count: user._count.interventions, icon: Wrench },
    { href: "quotes", label: "Devis", count: quoteCount, icon: FileText },
    { href: "invoices", label: "Factures", count: invoiceCount, icon: ReceiptText },
  ];

  return (
    <div>
      <PageHeader
        title={name}
        backHref="/admin/users"
        backLabel="Utilisateurs"
        action={
          canManage ? (
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          ) : undefined
        }
      />

      {/* Identité */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
              <Badge tone={sub.tone}>{sub.label}</Badge>
              {user.staffMembership ? (
                <Badge tone="blue">
                  <KeyRound className="h-3 w-3" />
                  staff · {user.staffMembership.role}
                </Badge>
              ) : null}
              {!user.emailVerifiedAt ? (
                <Badge tone="amber">
                  <MailWarning className="h-3 w-3" />
                  non vérifié
                </Badge>
              ) : null}
              {user.mustChangePassword ? (
                <Badge tone="red">changement de MDP requis</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {user.email} · {user.phone}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800">
          <Field label="Société" value={user.companyName} />
          <Field label="Métier" value={user.job} />
          <Field label="Mode de travail" value={user.workMode} />
          <Field label="Statut brut" value={user.subscriptionStatus} />
          <Field label="Essai jusqu'au" value={formatDate(user.trialEndsAt)} />
          <Field label="Inscrit le" value={formatDateTime(user.createdAt)} />
          <Field
            label="E-mail vérifié le"
            value={formatDateTime(user.emailVerifiedAt)}
          />
        </dl>
      </Card>

      {/* Données */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subViews.map((view) => {
          const Icon = view.icon;

          return (
            <Card
              key={view.href}
              as="a"
              href={`/admin/users/${user.id}/${view.href}`}
              hover
              className="flex items-center gap-4 p-4"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  {view.label}
                </span>
                <span className="block text-xl font-semibold tabular-nums">
                  {view.count}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
            </Card>
          );
        })}
      </div>

      {user.memberships.length > 0 ? (
        <Card className="mt-4 p-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Espaces de travail
          </h3>
          <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {user.memberships.map((membership) => (
              <li
                key={membership.id}
                className="flex items-center justify-between py-2"
              >
                <span className="flex items-center gap-2">
                  {membership.organization.name}
                  <Badge tone="slate">{membership.organization.type}</Badge>
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {membership.role}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {canManageStaff ? (
        <div className="mt-4">
          <StaffToggle
            userId={user.id}
            currentRole={user.staffMembership?.role ?? null}
            isSelf={user.id === viewer.id}
          />
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold tracking-tight">Actions</h2>
        <UserAdminPanel
          userId={user.id}
          email={user.email}
          subscriptionStatus={user.subscriptionStatus}
          trialEndsAt={trialEndsAtValue}
          canManage={canManage}
          canDelete={canDelete}
        />
      </section>

      <Card className="mt-8 p-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Historique admin sur ce compte
        </h3>
        {auditLogs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            Aucune action enregistrée.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {auditLogs.map((log) => (
              <li key={log.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="font-mono text-xs text-slate-400">
                      {log.action}
                    </span>{" "}
                    {log.summary}
                  </p>
                  <p className="text-xs text-slate-400">
                    {log.actor.email} · {formatDateTime(log.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
