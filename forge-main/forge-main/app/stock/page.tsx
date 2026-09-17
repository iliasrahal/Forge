import Link from "next/link";

import StockManager from "@/components/stock/StockManager";
import { getEffectiveMaterialsForWorkspace } from "@/src/lib/material-catalog.server";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function StockPage() {
  const context = await requireWorkspaceContext("read");
  const [items, materials] = await Promise.all([
    prisma.stockItem.findMany({
      where: { organizationId: context.workspace.id },
      include: { workspaceMaterial: { include: { catalogItem: true } }, movements: { orderBy: { createdAt: "desc" }, take: 20 } },
      orderBy: { updatedAt: "desc" },
    }),
    getEffectiveMaterialsForWorkspace(context.workspace.id, { limit: 250 }),
  ]);
  return <main className="min-h-dvh px-4 py-7 pb-36 sm:px-6 lg:pb-12"><section className="mx-auto max-w-5xl"><Link href="/settings" className="forge-back-link text-sm font-semibold text-blue-600 lg:hidden">Retour</Link><header className="mt-5 lg:mt-0"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{context.workspace.name}</p><h1 className="mt-2 text-3xl font-bold text-[var(--forge-text-primary)] sm:text-4xl">Stock</h1><p className="mt-2 max-w-2xl text-[var(--forge-text-secondary)]">Gardez un œil sur le matériel réellement disponible. Les mouvements conservent l’origine de chaque entrée et sortie.</p></header><StockManager canWrite={context.permissions.canWrite} materials={materials.map((material) => ({ id: material.id, workspaceMaterialId: material.workspaceMaterialId, catalogItemId: material.catalogItemId, name: material.name, brand: material.brand, reference: material.reference, unit: material.unit }))} initialItems={items.map((item) => ({ id: item.id, workspaceMaterialId: item.workspaceMaterialId, name: item.workspaceMaterial.name || item.workspaceMaterial.catalogItem?.name || "Matériel", brand: item.workspaceMaterial.brand ?? item.workspaceMaterial.catalogItem?.brand ?? null, reference: item.workspaceMaterial.reference ?? item.workspaceMaterial.catalogItem?.reference ?? null, unit: item.workspaceMaterial.unit ?? item.workspaceMaterial.catalogItem?.unit ?? "u", quantityMilli: item.quantityMilli, reservedQuantityMilli: item.reservedQuantityMilli, lowStockThresholdMilli: item.lowStockThresholdMilli, averageUnitCostCents: item.averageUnitCostCents, movements: item.movements.map((movement) => ({ ...movement, createdAt: movement.createdAt.toISOString() })) }))}/></section></main>;
}
