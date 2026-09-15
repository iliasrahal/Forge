import { NextResponse } from "next/server";

import { getEffectiveMaterialsForWorkspace } from "@/src/lib/material-catalog.server";
import { validateWorkspaceMaterialInput } from "@/src/lib/material-catalog";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function GET() {
  try {
    const context = await requireWorkspaceContext("read");
    const [materials, categories] = await Promise.all([
      getEffectiveMaterialsForWorkspace(context.workspace.id),
      prisma.materialCategory.findMany({ where: { active: true }, orderBy: [{ position: "asc" }, { name: "asc" }] }),
    ]);
    return NextResponse.json({ materials, categories, permissions: context.permissions });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("MATERIALS LIST ERROR", error);
    return NextResponse.json({ error: "Impossible de charger le matériel." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const validation = validateWorkspaceMaterialInput(await request.json());
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    if (validation.data.catalogItemId) {
      const catalog = await prisma.materialCatalogItem.findFirst({ where: { id: validation.data.catalogItemId, active: true }, select: { id: true } });
      if (!catalog) return NextResponse.json({ error: "Cette référence catalogue est introuvable." }, { status: 404 });
    }
    const material = await prisma.workspaceMaterial.upsert({
      where: validation.data.catalogItemId
        ? { organizationId_catalogItemId: { organizationId: context.workspace.id, catalogItemId: validation.data.catalogItemId } }
        : { id: "__new_custom_material__" },
      update: validation.data,
      create: { ...validation.data, organizationId: context.workspace.id },
    });
    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("MATERIAL CREATE ERROR", error);
    return NextResponse.json({ error: "Impossible d’enregistrer le matériel." }, { status: 500 });
  }
}
