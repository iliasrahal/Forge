import { NextResponse } from "next/server";

import { parseParisDateTime } from "@/src/lib/paris-datetime";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type Context = { params: Promise<{ id: string }> };

function quantityMilli(value: unknown) {
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) && number > 0 ? Math.round(number * 1000) : null;
}

function optionalCents(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) : null;
}

async function getIntervention(id: string, organizationId: string) {
  return prisma.intervention.findFirst({ where: { id, organizationId }, select: { id: true, organizationId: true } });
}

export async function POST(request: Request, { params }: Context) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const intervention = await getIntervention(id, workspace.workspace.id);
    if (!intervention?.organizationId) return NextResponse.json({ error: "Chantier introuvable." }, { status: 404 });
    const body = await request.json();
    const quantity = quantityMilli(body.quantity);
    if (!quantity) return NextResponse.json({ error: "La quantité doit être supérieure à zéro." }, { status: 400 });

    const catalogItem = typeof body.materialCatalogItemId === "string"
      ? await prisma.materialCatalogItem.findFirst({ where: { id: body.materialCatalogItemId, active: true } })
      : null;
    const workspaceMaterial = typeof body.workspaceMaterialId === "string"
      ? await prisma.workspaceMaterial.findFirst({ where: { id: body.workspaceMaterialId, organizationId: intervention.organizationId, active: true }, include: { catalogItem: true } })
      : null;
    const source = workspaceMaterial ?? catalogItem;
    const fallbackCatalog = workspaceMaterial?.catalogItem ?? null;
    const name = (typeof body.name === "string" ? body.name.trim() : "") || source?.name || fallbackCatalog?.name;
    if (!name) return NextResponse.json({ error: "La désignation du matériel est obligatoire." }, { status: 400 });
    const dayDate = typeof body.date === "string" && body.date ? parseParisDateTime(body.date, "00:00") : null;
    if (body.date && !dayDate) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    const creationKey = typeof body.creationKey === "string" && body.creationKey.trim()
      ? `${intervention.organizationId}:${id}:${body.creationKey.trim()}`.slice(0, 240)
      : null;

    const usage = await prisma.interventionMaterialUsage.create({ data: {
      interventionId: id,
      organizationId: intervention.organizationId,
      dayDate,
      materialCatalogItemId: workspaceMaterial?.catalogItemId ?? catalogItem?.id ?? null,
      workspaceMaterialId: workspaceMaterial?.id ?? null,
      name,
      brand: workspaceMaterial?.brand ?? catalogItem?.brand ?? fallbackCatalog?.brand ?? null,
      reference: workspaceMaterial?.reference ?? catalogItem?.reference ?? fallbackCatalog?.reference ?? null,
      specifications: workspaceMaterial?.specifications ?? catalogItem?.specifications ?? fallbackCatalog?.specifications ?? undefined,
      quantityMilli: quantity,
      unit: (typeof body.unit === "string" && body.unit.trim()) || workspaceMaterial?.unit || catalogItem?.unit || fallbackCatalog?.unit || "u",
      actualUnitCostCents: optionalCents(body.actualUnitCost),
      note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
      creationKey,
    } });
    return NextResponse.json({ usage }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("CREATE INTERVENTION MATERIAL USAGE ERROR", error);
    return NextResponse.json({ error: "Impossible d’ajouter ce matériel." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const intervention = await getIntervention(id, workspace.workspace.id);
    if (!intervention?.organizationId) return NextResponse.json({ error: "Chantier introuvable." }, { status: 404 });
    const body = await request.json();
    const result = await prisma.interventionMaterialUsage.deleteMany({ where: { id: body.id, interventionId: id, organizationId: intervention.organizationId } });
    if (!result.count) return NextResponse.json({ error: "Matériel introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de supprimer ce matériel." }, { status: 500 });
  }
}
