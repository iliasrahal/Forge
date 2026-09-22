import Link from "next/link";
import MarketplaceCard from "@/components/marketplace/MarketplaceCard";
import { marketplacePublicPostingSelect, toMarketplacePublicPosting } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function MyMarketplacePostingsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const context = await requireWorkspaceContext("read");
  const params = await searchParams;
  const records = await prisma.marketplaceJobPosting.findMany({ where: { organizationId: context.workspace.id }, select: { ...marketplacePublicPostingSelect, _count: { select: { applications: true, views: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <main className="min-h-dvh px-4 py-6 pb-40 sm:px-6 lg:pb-16"><div className="mx-auto max-w-6xl"><div className="flex items-end justify-between gap-3"><div><Link href="/marketplace" className="forge-back-link font-semibold text-blue-600">Retour</Link><h1 className="mt-5 text-3xl font-bold">Mes annonces</h1><p className="mt-2 text-[var(--forge-text-secondary)]">Annonces publiées par l’espace {context.workspace.name}.</p></div>{context.permissions.canWrite ? <Link href="/marketplace/new" className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white">Publier</Link> : null}</div>{params.deleted === "1" ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">Annonce supprimée.</p> : null}{records.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{records.map((record) => <MarketplaceCard key={record.id} posting={toMarketplacePublicPosting(record)} applicationCount={record._count.applications} uniqueViewCount={record._count.views}/>)}</div> : <p className="mt-8 rounded-3xl border border-dashed p-10 text-center text-[var(--forge-text-muted)]">Aucune annonce publiée.</p>}</div></main>;
}
