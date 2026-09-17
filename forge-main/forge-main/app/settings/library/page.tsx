import Link from "next/link";

import TradeLibraryClient from "@/components/library/TradeLibraryClient";
import WorkspaceTrades from "@/components/library/WorkspaceTrades";
import { getEffectiveMaterialsForWorkspace } from "@/src/lib/material-catalog.server";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function LibraryPage() {
  const context = await requireWorkspaceContext("read");
  const [materials, services, works] = await Promise.all([
    getEffectiveMaterialsForWorkspace(context.workspace.id),
    prisma.serviceCatalogItem.findMany({ where: { organizationId: context.workspace.id }, orderBy: [{ favorite: "desc" }, { name: "asc" }] }),
    prisma.quoteTemplate.findMany({ where: { active: true, OR: [{ organizationId: context.workspace.id }, { organizationId: null }] }, select: { id: true, organizationId: true, name: true, title: true, category: true, favorite: true, active: true, _count: { select: { lines: true } } }, orderBy: [{ favorite: "desc" }, { name: "asc" }] }),
  ]);
  return <main className="relative isolate min-h-dvh overflow-hidden bg-transparent px-4 py-8 pb-36 sm:px-6"><section className="mx-auto w-full max-w-4xl"><Link href="/settings" className="forge-back-link text-sm font-semibold text-blue-600 dark:text-blue-400">Retour</Link><header className="mt-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--forge-accent-blue-lit)]">{context.workspace.name}</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--forge-text-primary)] sm:text-4xl">Bibliothèque</h1><p className="mt-3 max-w-2xl text-[var(--forge-text-secondary)]">Tes matériaux, prestations, tarifs de main-d’œuvre et ouvrages réutilisables.</p></header><WorkspaceTrades initialTrades={context.workspace.tradeSlugs} canWrite={context.permissions.canWrite}/><TradeLibraryClient materials={materials} services={services} works={works.map((work) => ({ ...work, source: work.organizationId ? "workspace" as const : "forge" as const, lineCount: work._count.lines }))} canWrite={context.permissions.canWrite}/></section></main>;
}
