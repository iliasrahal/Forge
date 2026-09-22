import Link from "next/link";
import { MarketplaceApplicationAction } from "@/components/marketplace/MarketplaceActions";
import { formatMarketplaceApplicationStatus } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function MyMarketplaceRequestsPage() {
  const context = await requireWorkspaceContext("read");
  const applications = await prisma.marketplaceJobApplication.findMany({ where: { applicantUserId: context.user.id }, select: { id: true, status: true, createdAt: true, posting: { select: { id: true, title: true, startDate: true, endDate: true, organization: { select: { name: true, legalName: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <main className="min-h-dvh px-4 py-6 pb-40 sm:px-6 lg:pb-16"><div className="mx-auto max-w-3xl"><Link href="/marketplace" className="forge-back-link font-semibold text-blue-600">Retour</Link><h1 className="mt-5 text-3xl font-bold">Mes demandes</h1>{applications.length ? <div className="mt-6 space-y-3">{applications.map((application) => <article key={application.id} className="forge-surface rounded-2xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/marketplace/${application.posting.id}`} className="font-bold text-blue-700 dark:text-blue-300">{application.posting.title}</Link><p className="mt-1 text-sm text-[var(--forge-text-muted)]">{application.posting.organization.legalName || application.posting.organization.name} · {application.posting.startDate.toLocaleDateString("fr-FR")} → {application.posting.endDate.toLocaleDateString("fr-FR")}</p></div><span className="text-sm font-semibold">{formatMarketplaceApplicationStatus(application.status)}</span></div>{application.status === "PENDING" && context.permissions.canWrite ? <div className="mt-3"><MarketplaceApplicationAction applicationId={application.id} action="cancel"/></div> : null}</article>)}</div> : <p className="mt-8 rounded-3xl border border-dashed p-10 text-center text-[var(--forge-text-muted)]">Aucune demande envoyée.</p>}</div></main>;
}
