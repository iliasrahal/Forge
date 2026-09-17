import { Prisma, StockMovementOrigin, StockMovementType } from "@/src/generated/prisma/client";

export function parseQuantityMilli(value: unknown) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 1000) : null;
}

export function formatStockQuantity(quantityMilli: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(quantityMilli / 1000);
}

export function computeStockChange(input: { currentMilli: number; averageUnitCostCents: number | null; deltaMilli: number; incomingUnitCostCents?: number | null; allowNegative?: boolean }) {
  const quantityMilli = input.currentMilli + input.deltaMilli;
  if (quantityMilli < 0 && !input.allowNegative) throw new Error("STOCK_INSUFFICIENT");
  const averageUnitCostCents = input.deltaMilli > 0 && input.incomingUnitCostCents != null && quantityMilli > 0
    ? Math.round(((input.currentMilli * (input.averageUnitCostCents ?? input.incomingUnitCostCents)) + (input.deltaMilli * input.incomingUnitCostCents)) / quantityMilli)
    : input.averageUnitCostCents;
  return { quantityMilli, averageUnitCostCents };
}

export async function ensureWorkspaceMaterial(
  tx: Prisma.TransactionClient,
  input: { organizationId: string; workspaceMaterialId?: string | null; catalogItemId?: string | null },
) {
  if (input.workspaceMaterialId) {
    return tx.workspaceMaterial.findFirst({ where: { id: input.workspaceMaterialId, organizationId: input.organizationId, active: true } });
  }
  if (!input.catalogItemId) return null;
  const catalog = await tx.materialCatalogItem.findFirst({ where: { id: input.catalogItemId, active: true } });
  if (!catalog) return null;
  return tx.workspaceMaterial.upsert({
    where: { organizationId_catalogItemId: { organizationId: input.organizationId, catalogItemId: catalog.id } },
    update: { active: true },
    create: { organizationId: input.organizationId, catalogItemId: catalog.id, active: true },
  });
}

export async function applyStockDelta(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    workspaceMaterialId: string;
    deltaMilli: number;
    type: StockMovementType;
    origin: StockMovementOrigin;
    actorUserId?: string | null;
    unitCostCents?: number | null;
    sourceKey?: string | null;
    sourceId?: string | null;
    sourceLabel?: string | null;
    interventionId?: string | null;
    purchaseId?: string | null;
    invoiceId?: string | null;
    materialUsageId?: string | null;
    note?: string | null;
    allowNegative?: boolean;
  },
) {
  if (!Number.isInteger(input.deltaMilli) || input.deltaMilli === 0) throw new Error("STOCK_QUANTITY_INVALID");
  if (input.sourceKey) {
    const existing = await tx.stockMovement.findUnique({ where: { sourceKey: input.sourceKey } });
    if (existing) return existing;
  }
  const item = await tx.stockItem.upsert({
    where: { workspaceMaterialId: input.workspaceMaterialId },
    update: {},
    create: { organizationId: input.organizationId, workspaceMaterialId: input.workspaceMaterialId },
  });
  if (item.organizationId !== input.organizationId) throw new Error("STOCK_WORKSPACE_MISMATCH");
  const next = computeStockChange({ currentMilli: item.quantityMilli, averageUnitCostCents: item.averageUnitCostCents, deltaMilli: input.deltaMilli, incomingUnitCostCents: input.unitCostCents, allowNegative: input.allowNegative });
  await tx.stockItem.update({
    where: { id: item.id },
    data: { quantityMilli: next.quantityMilli, averageUnitCostCents: next.averageUnitCostCents },
  });
  return tx.stockMovement.create({ data: {
    organizationId: input.organizationId,
    stockItemId: item.id,
    type: input.type,
    origin: input.origin,
    quantityDeltaMilli: input.deltaMilli,
    balanceAfterMilli: next.quantityMilli,
    unitCostCents: input.unitCostCents ?? null,
    sourceKey: input.sourceKey ?? null,
    sourceId: input.sourceId ?? null,
    sourceLabel: input.sourceLabel ?? null,
    interventionId: input.interventionId ?? null,
    purchaseId: input.purchaseId ?? null,
    invoiceId: input.invoiceId ?? null,
    materialUsageId: input.materialUsageId ?? null,
    actorUserId: input.actorUserId ?? null,
    note: input.note ?? null,
  } });
}

export function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}
