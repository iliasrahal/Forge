import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketplaceApplicationAction, MarketplaceApply, MarketplacePostingActions } from "@/components/marketplace/MarketplaceActions";
import { canManageMarketplacePosting, formatMarketplaceApplicationStatus, marketplacePublicPostingSelect, toMarketplacePublicPosting } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const date = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireWorkspaceContext("read");
  const { id } = await params;
  const record = await prisma.marketplaceJobPosting.findUnique({ where: { id }, select: marketplacePublicPostingSelect });
  if (!record) notFound();
  const posting = toMarketplacePublicPosting(record);
  const canViewManagement = canManageMarketplacePosting({ postingOrganizationId: record.organizationId, postingCreatedByUserId: record.createdByUserId, activeOrganizationId: context.workspace.id, userId: context.user.id, role: context.membership.role });
  const canManage = context.permissions.canWrite && canViewManagement;
  const [ownApplication, receivedApplications] = await Promise.all([
    prisma.marketplaceJobApplication.findUnique({ where: { postingId_applicantUserId: { postingId: id, applicantUserId: context.user.id } }, select: { id: true, status: true } }),
    canViewManagement ? prisma.marketplaceJobApplication.findMany({ where: { postingId: id }, select: { id: true, status: true, message: true, createdAt: true, applicantUser: { select: { firstName: true, lastName: true, companyName: true, job: true } }, representedOrganization: { select: { name: true, legalName: true } } }, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
  ]);
  const isOwnWorkspace = Boolean(await prisma.organizationMember.findUnique({ where: { userId_organizationId: { userId: context.user.id, organizationId: record.organizationId } }, select: { id: true } }));
  const roleAllowsWrite = context.membership.role === "OWNER" || context.membership.role === "ADMIN" || context.membership.role === "LEGACY_TECHNICIAN";

  return <main className="min-h-dvh px-4 py-6 pb-40 sm:px-6 lg:pb-16"><div className="mx-auto max-w-3xl"><Link href="/marketplace" className="forge-back-link font-semibold text-blue-600">Retour</Link>
    <article className="forge-surface mt-6 rounded-[2rem] border p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{posting.trade}</span><span className="text-sm font-semibold text-[var(--forge-text-muted)]">{posting.status === "OPEN" ? "Ouverte" : posting.status === "FILLED" ? "Complète" : "Fermée"}</span></div><h1 className="mt-5 text-3xl font-bold text-[var(--forge-text-primary)]">{posting.title}</h1><p className="mt-3 font-semibold text-blue-600 dark:text-blue-400">{posting.location}</p><div className="mt-4 grid gap-2 text-sm text-[var(--forge-text-secondary)] sm:grid-cols-2"><p>{date(posting.startDate)} → {date(posting.endDate)}</p><p>{posting.remainingPositions} place{posting.remainingPositions > 1 ? "s" : ""} disponible{posting.remainingPositions > 1 ? "s" : ""}</p>{posting.budgetCents !== null ? <p>Budget : {euro.format(posting.budgetCents / 100)}</p> : null}<p>Publié par {posting.publisher}</p></div><p className="mt-6 whitespace-pre-line leading-7 text-[var(--forge-text-secondary)]">{posting.description}</p>{canManage ? <MarketplacePostingActions postingId={id} canWrite={context.permissions.canWrite}/> : null}</article>
    {!isOwnWorkspace && posting.status === "OPEN" && posting.remainingPositions > 0 ? <section className="forge-surface mt-5 rounded-3xl border p-5"><MarketplaceApply postingId={id} canWrite={context.permissions.canWrite} subscriptionRequired={roleAllowsWrite && !context.subscription.hasAccess} existingStatus={ownApplication ? formatMarketplaceApplicationStatus(ownApplication.status) : null}/></section> : null}
    {canViewManagement ? <section className="forge-surface mt-5 rounded-3xl border p-5"><h2 className="text-xl font-bold">Demandes reçues</h2>{receivedApplications.length ? <div className="mt-4 space-y-3">{receivedApplications.map((application) => <article key={application.id} className="rounded-2xl bg-[var(--forge-surface-secondary)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{application.applicantUser.firstName} {application.applicantUser.lastName ?? ""}</p><p className="text-sm text-[var(--forge-text-muted)]">{application.applicantUser.companyName || application.representedOrganization?.legalName || application.representedOrganization?.name || "Artisan Forge"}{application.applicantUser.job ? ` · ${application.applicantUser.job.replaceAll("_", " ").toLocaleLowerCase("fr-FR")}` : ""}</p></div><span className="text-xs font-semibold">{formatMarketplaceApplicationStatus(application.status)}</span></div>{application.message ? <p className="mt-3 text-sm text-[var(--forge-text-secondary)]">{application.message}</p> : null}{application.status === "PENDING" && canManage ? <div className="mt-3 flex gap-2"><MarketplaceApplicationAction applicationId={application.id} action="accept"/><MarketplaceApplicationAction applicationId={application.id} action="reject"/></div> : null}</article>)}</div> : <p className="mt-4 text-sm text-[var(--forge-text-muted)]">Aucune demande pour le moment.</p>}</section> : null}
  </div></main>;
}
