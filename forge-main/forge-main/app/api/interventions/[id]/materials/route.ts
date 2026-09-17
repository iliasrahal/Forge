import { NextResponse } from "next/server";
import { Prisma, StockMovementOrigin, StockMovementType } from "@/src/generated/prisma/client";

import { parseParisDateTime } from "@/src/lib/paris-datetime";
import { prisma } from "@/src/lib/prisma";
import { applyStockDelta } from "@/src/lib/stock";
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
    const organizationId = intervention.organizationId;
    const body = await request.json();
    const quantity = quantityMilli(body.quantity);
    if (!quantity) return NextResponse.json({ error: "La quantité doit être supérieure à zéro." }, { status: 400 });
    const purchaseLine = typeof body.purchaseLineId === "string" && body.purchaseLineId
      ? await prisma.purchaseLine.findFirst({ where: { id: body.purchaseLineId, organizationId, purchase: { status: "ACTIVE" } }, include: { purchase: true, allocations: { select: { quantityMilli: true } } } })
      : null;
    if (body.purchaseLineId && !purchaseLine) return NextResponse.json({ error: "Ligne d’achat introuvable dans cet espace." }, { status: 400 });
    if (purchaseLine && purchaseLine.allocations.reduce((sum, allocation) => sum + allocation.quantityMilli, 0) + quantity > purchaseLine.quantityMilli) return NextResponse.json({ error: "La quantité dépasse le solde disponible de cet achat." }, { status: 400 });

    const catalogItem = typeof body.materialCatalogItemId === "string"
      ? await prisma.materialCatalogItem.findFirst({ where: { id: body.materialCatalogItemId, active: true } })
      : null;
    let workspaceMaterial = typeof body.workspaceMaterialId === "string"
      ? await prisma.workspaceMaterial.findFirst({ where: { id: body.workspaceMaterialId, organizationId: intervention.organizationId, active: true }, include: { catalogItem: true } })
      : null;
    if (!workspaceMaterial && catalogItem) {
      workspaceMaterial = await prisma.workspaceMaterial.upsert({
        where: { organizationId_catalogItemId: { organizationId, catalogItemId: catalogItem.id } },
        update: { active: true }, create: { organizationId, catalogItemId: catalogItem.id, active: true }, include: { catalogItem: true },
      });
    }
    const source = workspaceMaterial ?? catalogItem;
    const fallbackCatalog = workspaceMaterial?.catalogItem ?? null;
    const name = (typeof body.name === "string" ? body.name.trim() : "") || purchaseLine?.name || source?.name || fallbackCatalog?.name;
    if (!name) return NextResponse.json({ error: "La désignation du matériel est obligatoire." }, { status: 400 });
    const dayDate = typeof body.date === "string" && body.date ? parseParisDateTime(body.date, "00:00") : null;
    if (body.date && !dayDate) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    const creationKey = typeof body.creationKey === "string" && body.creationKey.trim()
      ? `${intervention.organizationId}:${id}:${body.creationKey.trim()}`.slice(0, 240)
      : null;

    const usage = await prisma.$transaction(async (tx) => {
      const stockItem = workspaceMaterial ? await tx.stockItem.findUnique({ where: { workspaceMaterialId: workspaceMaterial.id } }) : null;
      if (stockItem && stockItem.quantityMilli < quantity && body.confirmInsufficientStock !== true) throw new Error("STOCK_INSUFFICIENT");
      const created = await tx.interventionMaterialUsage.create({ data: {
      interventionId: id,
      organizationId,
      dayDate,
      materialCatalogItemId: purchaseLine?.materialCatalogItemId ?? workspaceMaterial?.catalogItemId ?? catalogItem?.id ?? null,
      workspaceMaterialId: purchaseLine?.workspaceMaterialId ?? workspaceMaterial?.id ?? null,
      purchaseLineId: purchaseLine?.id ?? null,
      name,
      brand: purchaseLine?.brand ?? workspaceMaterial?.brand ?? catalogItem?.brand ?? fallbackCatalog?.brand ?? null,
      reference: purchaseLine?.reference ?? workspaceMaterial?.reference ?? catalogItem?.reference ?? fallbackCatalog?.reference ?? null,
      specifications: workspaceMaterial?.specifications ?? catalogItem?.specifications ?? fallbackCatalog?.specifications ?? undefined,
      quantityMilli: quantity,
      unit: purchaseLine?.unit ?? ((typeof body.unit === "string" && body.unit.trim()) || workspaceMaterial?.unit || catalogItem?.unit || fallbackCatalog?.unit || "u"),
      actualUnitCostCents: purchaseLine?.unitPriceCents ?? stockItem?.averageUnitCostCents ?? optionalCents(body.actualUnitCost),
      note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
      creationKey,
      } });
      if (purchaseLine) await tx.purchaseAllocation.create({ data: { organizationId, purchaseId: purchaseLine.purchaseId, purchaseLineId: purchaseLine.id, interventionId: id, materialUsageId: created.id, quantityMilli: quantity, unitCostCents: purchaseLine.unitPriceCents, amountCents: Math.round(quantity * purchaseLine.unitPriceCents / 1000), lineType: purchaseLine.lineType } });
      if (stockItem && workspaceMaterial) await applyStockDelta(tx, { organizationId, workspaceMaterialId: workspaceMaterial.id, deltaMilli: -quantity, type: StockMovementType.EXIT, origin: StockMovementOrigin.MATERIAL_USAGE, actorUserId: workspace.user.id, sourceKey: `material-usage:${created.id}`, sourceId: created.id, sourceLabel: `Chantier · ${name}`, interventionId: id, materialUsageId: created.id, unitCostCents: stockItem.averageUnitCostCents, allowNegative: body.confirmInsufficientStock === true });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ usage }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    if (error instanceof Error && error.message === "STOCK_INSUFFICIENT") return NextResponse.json({ error: "Le stock disponible est insuffisant pour cette utilisation.", code: "STOCK_INSUFFICIENT" }, { status: 409 });
    console.error("CREATE INTERVENTION MATERIAL USAGE ERROR", error);
    return NextResponse.json({ error: "Impossible d’ajouter ce matériel." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const intervention = await getIntervention(id, workspace.workspace.id);
    if (!intervention?.organizationId) return NextResponse.json({ error: "Chantier introuvable." }, { status: 404 });
    const body = await request.json();
    const nextQuantity = quantityMilli(body.quantity);
    if (!nextQuantity) return NextResponse.json({ error: "La quantité doit être supérieure à zéro." }, { status: 400 });
    const usage = await prisma.interventionMaterialUsage.findFirst({ where: { id: body.id, interventionId: id, organizationId: intervention.organizationId }, include: { stockMovement: true, purchaseAllocation: true } });
    if (!usage) return NextResponse.json({ error: "Matériel introuvable." }, { status: 404 });
    const stockDelta = usage.quantityMilli - nextQuantity;
    await prisma.$transaction(async (tx) => {
      if (stockDelta !== 0 && usage.stockMovement && usage.workspaceMaterialId) {
        const stock = await tx.stockItem.findUnique({ where: { workspaceMaterialId: usage.workspaceMaterialId } });
        if (stock && stock.quantityMilli + stockDelta < 0 && body.confirmInsufficientStock !== true) throw new Error("STOCK_INSUFFICIENT");
        await applyStockDelta(tx, { organizationId: intervention.organizationId!, workspaceMaterialId: usage.workspaceMaterialId, deltaMilli: stockDelta, type: stockDelta > 0 ? StockMovementType.RETURN : StockMovementType.EXIT, origin: StockMovementOrigin.MATERIAL_USAGE, actorUserId: workspace.user.id, sourceKey: `material-usage-correction:${usage.id}:${String(body.requestKey ?? nextQuantity)}`, sourceId: usage.id, sourceLabel: `Correction chantier · ${usage.name}`, interventionId: id, unitCostCents: usage.actualUnitCostCents, allowNegative: body.confirmInsufficientStock === true });
      }
      await tx.interventionMaterialUsage.update({ where: { id: usage.id }, data: { quantityMilli: nextQuantity } });
      if (usage.purchaseAllocation) await tx.purchaseAllocation.update({ where: { id: usage.purchaseAllocation.id }, data: { quantityMilli: nextQuantity, amountCents: Math.round(nextQuantity * usage.purchaseAllocation.unitCostCents / 1000) } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    if (error instanceof Error && error.message === "STOCK_INSUFFICIENT") return NextResponse.json({ error: "Le stock disponible est insuffisant pour cette correction.", code: "STOCK_INSUFFICIENT" }, { status: 409 });
    console.error("UPDATE INTERVENTION MATERIAL USAGE ERROR", error);
    return NextResponse.json({ error: "Impossible de modifier ce matériel." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const intervention = await getIntervention(id, workspace.workspace.id);
    if (!intervention?.organizationId) return NextResponse.json({ error: "Chantier introuvable." }, { status: 404 });
    const body = await request.json();
    const usage = await prisma.interventionMaterialUsage.findFirst({ where: { id: body.id, interventionId: id, organizationId: intervention.organizationId }, include: { stockMovement: true } });
    if (!usage) return NextResponse.json({ error: "Matériel introuvable." }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      if (usage.stockMovement && usage.workspaceMaterialId) await applyStockDelta(tx, { organizationId: intervention.organizationId!, workspaceMaterialId: usage.workspaceMaterialId, deltaMilli: usage.quantityMilli, type: StockMovementType.RETURN, origin: StockMovementOrigin.MATERIAL_USAGE, actorUserId: workspace.user.id, sourceKey: `material-usage-return:${usage.id}`, sourceId: usage.id, sourceLabel: `Retour chantier · ${usage.name}`, interventionId: id, unitCostCents: usage.actualUnitCostCents });
      await tx.interventionMaterialUsage.delete({ where: { id: usage.id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de supprimer ce matériel." }, { status: 500 });
  }
}
