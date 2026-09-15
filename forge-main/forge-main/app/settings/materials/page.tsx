import Link from "next/link";

import MaterialLibraryClient from "@/components/materials/MaterialLibraryClient";
import { getEffectiveMaterialsForWorkspace } from "@/src/lib/material-catalog.server";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function MaterialsSettingsPage() {
  const context = await requireWorkspaceContext("read");
  const materials = await getEffectiveMaterialsForWorkspace(context.workspace.id);
  return <main className="relative isolate min-h-dvh overflow-hidden bg-transparent px-4 py-8 sm:px-6"><section className="mx-auto w-full max-w-4xl"><Link href="/settings" className="forge-back-link text-sm font-semibold text-blue-600 dark:text-blue-400">Retour</Link><header className="mt-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--forge-accent-blue-lit)]">{context.workspace.name}</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--forge-text-primary)] sm:text-4xl">Bibliothèque matériel</h1><p className="mt-3 max-w-2xl text-[var(--forge-text-secondary)]">Retrouve les références Forge et adapte favoris, fournisseurs et tarifs à ton espace.</p></header><MaterialLibraryClient initialMaterials={materials} canWrite={context.permissions.canWrite} /></section></main>;
}
