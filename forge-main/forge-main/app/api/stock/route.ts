import { NextResponse } from "next/server";
import { Prisma, StockMovementOrigin, StockMovementType } from "@/src/generated/prisma/client";

import { prisma } from "@/src/lib/prisma";
import { applyStockDelta, ensureWorkspaceMaterial, isRetryableTransactionError, parseQuantityMilli } from "@/src/lib/stock";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

async function serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (attempt < 2 && isRetryableTransactionError(error)) continue;
      throw error;
    }
  }
  throw new Error("STOCK_TRANSACTION_FAILED");
}

export async function GET(request: Request) {
  try {
    const context = await requireWorkspaceContext("read");
    const search = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    const items = await prisma.stockItem.findMany({
      where: {
        organizationId: context.workspace.id,
        ...(search ? { workspaceMaterial: { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
          { reference: { contains: search, mode: "insensitive" } },
          { catalogItem: { OR: [
            { name: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
            { reference: { contains: search, mode: "insensitive" } },
          ] } },
        ] } } : {}),
      },
      include: {
        workspaceMaterial: { include: { catalogItem: true } },
        movements: { orderBy: { createdAt: "desc" }, take: 20 },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    return NextResponse.json({ error: "Impossible de charger le stock." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    const result = await serializable(async (tx) => {
      let workspaceMaterial = await ensureWorkspaceMaterial(tx, {
        organizationId: context.workspace.id,
        workspaceMaterialId: typeof body.workspaceMaterialId === "string" ? body.workspaceMaterialId : null,
        catalogItemId: typeof body.catalogItemId === "string" ? body.catalogItemId : null,
      });
      if (!workspaceMaterial && action === "createCustom") {
        const name = typeof body.name === "string" ? body.name.trim().slice(0, 160) : "";
        if (!name) throw new Error("STOCK_MATERIAL_REQUIRED");
        workspaceMaterial = await tx.workspaceMaterial.create({ data: {
          organizationId: context.workspace.id,
          name,
          unit: typeof body.unit === "string" && body.unit.trim() ? body.unit.trim().slice(0, 30) : "u",
          active: true,
        } });
      }
      if (!workspaceMaterial) throw new Error("STOCK_MATERIAL_REQUIRED");

      const existing = await tx.stockItem.findUnique({ where: { workspaceMaterialId: workspaceMaterial.id } });
      if (action === "threshold") {
        const threshold = body.threshold === "" || body.threshold == null ? null : parseQuantityMilli(body.threshold);
        if (threshold === null && body.threshold !== "" && body.threshold != null) throw new Error("STOCK_QUANTITY_INVALID");
        return tx.stockItem.upsert({
          where: { workspaceMaterialId: workspaceMaterial.id },
          update: { lowStockThresholdMilli: threshold },
          create: { organizationId: context.workspace.id, workspaceMaterialId: workspaceMaterial.id, lowStockThresholdMilli: threshold },
        });
      }

      const quantity = parseQuantityMilli(body.quantity);
      if (quantity === null) throw new Error("STOCK_QUANTITY_INVALID");
      let delta = quantity;
      let type: StockMovementType = StockMovementType.ENTRY;
      if (action === "remove") { delta = -quantity; type = StockMovementType.EXIT; }
      if (action === "adjust") { delta = quantity - (existing?.quantityMilli ?? 0); type = StockMovementType.ADJUSTMENT; }
      if (delta === 0) return existing ?? tx.stockItem.create({ data: { organizationId: context.workspace.id, workspaceMaterialId: workspaceMaterial.id } });
      const movement = await applyStockDelta(tx, {
        organizationId: context.workspace.id,
        workspaceMaterialId: workspaceMaterial.id,
        deltaMilli: delta,
        type,
        origin: StockMovementOrigin.MANUAL,
        actorUserId: context.user.id,
        note: typeof body.note === "string" ? body.note.trim().slice(0, 500) : null,
        allowNegative: body.confirmNegative === true,
      });
      return movement;
    });
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    const message = error instanceof Error ? error.message : "";
    if (message === "STOCK_INSUFFICIENT") return NextResponse.json({ error: "La quantité dépasse le stock disponible.", code: message }, { status: 409 });
    if (message === "STOCK_MATERIAL_REQUIRED") return NextResponse.json({ error: "Choisis ou crée un matériel du workspace." }, { status: 400 });
    if (message === "STOCK_QUANTITY_INVALID") return NextResponse.json({ error: "La quantité est invalide." }, { status: 400 });
    console.error("STOCK ACTION ERROR", error);
    return NextResponse.json({ error: "Impossible de mettre à jour le stock." }, { status: 500 });
  }
}
