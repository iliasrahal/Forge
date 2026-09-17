import { prisma } from "@/src/lib/prisma";
import { buildEffectiveMaterials } from "@/src/lib/material-catalog";
import type { PersistableDocumentLine } from "@/src/lib/document-lines";

export async function getEffectiveMaterialsForWorkspace(organizationId: string, options: { search?: string; limit?: number } = {}) {
  const search = options.search?.trim().slice(0, 120) ?? "";
  const take = Math.min(Math.max(options.limit ?? 100, 1), 200);
  const textFilter = search
    ? {
        OR: [
          ...["name", "brand", "reference", "description"].map((field) => ({ [field]: { contains: search, mode: "insensitive" as const } })),
          { category: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};
  const [catalog, customMaterials, organization] = await Promise.all([
    prisma.materialCatalogItem.findMany({
      where: { active: true, ...textFilter },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }], select: { id: true, kind: true, isPrimary: true, position: true, width: true, height: true } },
        workspaceMaterials: { where: { organizationId }, take: 1, include: { images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }], select: { id: true, kind: true, isPrimary: true, position: true, width: true, height: true } } } },
      },
      orderBy: [{ name: "asc" }],
      take,
    }),
    prisma.workspaceMaterial.findMany({
      where: { organizationId, catalogItemId: null, ...(search ? { OR: ["name", "brand", "reference", "description"].map((field) => ({ [field]: { contains: search, mode: "insensitive" as const } })) } : {}) },
      include: { images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }], select: { id: true, kind: true, isPrimary: true, position: true, width: true, height: true } } },
      orderBy: [{ favorite: "desc" }, { name: "asc" }],
      take,
    }),
    prisma.organization.findUnique({ where: { id: organizationId }, select: { tradeSlugs: true } }),
  ]);
  const materials = buildEffectiveMaterials(catalog, customMaterials);
  const trades = new Set(organization?.tradeSlugs ?? []);
  return materials.sort((left, right) => {
    const leftRelevant = (left.tradeSlugs ?? []).some((trade) => trades.has(trade));
    const rightRelevant = (right.tradeSlugs ?? []).some((trade) => trades.has(trade));
    return Number(right.favorite) - Number(left.favorite) || Number(rightRelevant) - Number(leftRelevant) || left.name.localeCompare(right.name, "fr");
  });
}

/** Neutralise toute relation catalogue falsifiée dans le JSON du formulaire. */
export async function secureMaterialLineSources(
  lines: PersistableDocumentLine[],
  organizationId: string,
) {
  const catalogIds = [...new Set(lines.map((line) => line.materialCatalogItemId).filter((id): id is string => Boolean(id)))];
  const workspaceIds = [...new Set(lines.map((line) => line.workspaceMaterialId).filter((id): id is string => Boolean(id)))];
  const [catalog, workspace] = await Promise.all([
    prisma.materialCatalogItem.findMany({ where: { id: { in: catalogIds }, active: true }, select: { id: true } }),
    prisma.workspaceMaterial.findMany({ where: { id: { in: workspaceIds }, organizationId }, select: { id: true, catalogItemId: true } }),
  ]);
  const allowedCatalog = new Set(catalog.map((item) => item.id));
  const allowedWorkspace = new Map(workspace.map((item) => [item.id, item.catalogItemId]));
  return lines.map((line) => {
    const workspaceCatalogId = line.workspaceMaterialId ? allowedWorkspace.get(line.workspaceMaterialId) : undefined;
    const workspaceMaterialId = line.workspaceMaterialId && allowedWorkspace.has(line.workspaceMaterialId) ? line.workspaceMaterialId : null;
    const requestedCatalogId = line.materialCatalogItemId;
    const materialCatalogItemId =
      requestedCatalogId && allowedCatalog.has(requestedCatalogId) && (!workspaceMaterialId || !workspaceCatalogId || workspaceCatalogId === requestedCatalogId)
        ? requestedCatalogId
        : workspaceCatalogId && allowedCatalog.has(workspaceCatalogId)
          ? workspaceCatalogId
          : null;
    return { ...line, workspaceMaterialId, materialCatalogItemId };
  });
}
