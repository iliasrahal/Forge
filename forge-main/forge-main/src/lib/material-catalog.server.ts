import { prisma } from "@/src/lib/prisma";
import { buildEffectiveMaterials } from "@/src/lib/material-catalog";
import type { PersistableDocumentLine } from "@/src/lib/document-lines";

export async function getEffectiveMaterialsForWorkspace(organizationId: string) {
  const [catalog, customMaterials] = await Promise.all([
    prisma.materialCatalogItem.findMany({
      where: { active: true },
      include: {
        category: { select: { id: true, name: true } },
        workspaceMaterials: { where: { organizationId }, take: 1 },
      },
      orderBy: [{ name: "asc" }],
    }),
    prisma.workspaceMaterial.findMany({
      where: { organizationId, catalogItemId: null },
      orderBy: [{ favorite: "desc" }, { name: "asc" }],
    }),
  ]);
  return buildEffectiveMaterials(catalog, customMaterials);
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
