import { NextResponse } from "next/server";
import { parseParisDateTime } from "@/src/lib/paris-datetime";
import { prisma } from "@/src/lib/prisma";
import { normalizePurchaseLines, purchaseTotals } from "@/src/lib/purchases";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function GET(request: Request) {
  try {
    const context = await requireWorkspaceContext("read");
    const params = new URL(request.url).searchParams; const search = params.get("q")?.trim().slice(0, 100) ?? "";
    const purchases = await prisma.purchase.findMany({
      where: { organizationId: context.workspace.id, ...(search ? { OR: [{ reference: { contains: search, mode: "insensitive" } }, { supplierName: { contains: search, mode: "insensitive" } }, { lines: { some: { name: { contains: search, mode: "insensitive" } } } }] } : {}) },
      include: { supplier: { select: { id: true, name: true } }, intervention: { select: { id: true, title: true } }, _count: { select: { lines: true } } },
      orderBy: { purchasedAt: "desc" }, take: 100,
    });
    return NextResponse.json({ purchases });
  } catch (error) { const access = getWorkspaceErrorResponse(error); if (access) return NextResponse.json(access.body, { status: access.status }); return NextResponse.json({ error: "Impossible de charger les achats." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write"); const body = await request.json();
    let lines;
    try { lines = normalizePurchaseLines(body.lines); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Lignes invalides." }, { status: 400 }); }
    const purchasedAt = typeof body.purchasedAt === "string" ? parseParisDateTime(body.purchasedAt, "12:00") : null;
    if (!purchasedAt) return NextResponse.json({ error: "Date d’achat invalide." }, { status: 400 });
    const supplier = typeof body.supplierId === "string" && body.supplierId ? await prisma.supplier.findFirst({ where: { id: body.supplierId, organizationId: context.workspace.id, active: true } }) : null;
    if (body.supplierId && !supplier) return NextResponse.json({ error: "Fournisseur introuvable dans cet espace." }, { status: 400 });
    const intervention = typeof body.interventionId === "string" && body.interventionId ? await prisma.intervention.findFirst({ where: { id: body.interventionId, organizationId: context.workspace.id }, select: { id: true } }) : null;
    if (body.interventionId && !intervention) return NextResponse.json({ error: "Chantier introuvable dans cet espace." }, { status: 400 });

    const workspaceIds = [...new Set(lines.map((line) => line.workspaceMaterialId).filter((id): id is string => Boolean(id)))];
    const catalogIds = [...new Set(lines.map((line) => line.materialCatalogItemId).filter((id): id is string => Boolean(id)))];
    const [workspaceMaterials, catalogMaterials] = await Promise.all([
      prisma.workspaceMaterial.findMany({ where: { id: { in: workspaceIds }, organizationId: context.workspace.id }, include: { catalogItem: true } }),
      prisma.materialCatalogItem.findMany({ where: { id: { in: catalogIds }, active: true } }),
    ]);
    const workspaceMap = new Map(workspaceMaterials.map((item) => [item.id, item])); const catalogMap = new Map(catalogMaterials.map((item) => [item.id, item]));
    if (workspaceIds.some((id) => !workspaceMap.has(id)) || catalogIds.some((id) => !catalogMap.has(id))) return NextResponse.json({ error: "Un matériau n’est pas accessible dans cet espace." }, { status: 400 });
    const totals = purchaseTotals(lines);
    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({ data: { organizationId: context.workspace.id, supplierId: supplier?.id ?? null, interventionId: intervention?.id ?? null, purchasedAt, reference: typeof body.reference === "string" && body.reference.trim() ? body.reference.trim().slice(0, 120) : null, supplierName: supplier?.companyName || supplier?.name || null, note: typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : null, ...totals } });
      for (const line of lines) {
        const workspaceMaterial = line.workspaceMaterialId ? workspaceMap.get(line.workspaceMaterialId) : null; const catalog = line.materialCatalogItemId ? catalogMap.get(line.materialCatalogItemId) : workspaceMaterial?.catalogItem;
        const createdLine = await tx.purchaseLine.create({ data: { purchaseId: created.id, organizationId: context.workspace.id, materialCatalogItemId: workspaceMaterial?.catalogItemId ?? catalog?.id ?? null, workspaceMaterialId: workspaceMaterial?.id ?? null, lineType: line.lineType, name: line.name || workspaceMaterial?.name || catalog?.name || "Achat", brand: workspaceMaterial?.brand ?? catalog?.brand ?? null, reference: workspaceMaterial?.reference ?? catalog?.reference ?? null, quantityMilli: line.quantityMilli, unit: line.unit, unitPriceCents: line.unitPriceCents, vatRateBp: line.vatRateBp, netAmountCents: line.netAmountCents, vatAmountCents: line.vatAmountCents, totalAmountCents: line.totalAmountCents, supplierName: supplier?.companyName || supplier?.name || null } });
        if (workspaceMaterial) await tx.workspaceMaterial.update({ where: { id: workspaceMaterial.id }, data: { purchasePriceCents: line.unitPriceCents, preferredSupplierId: supplier?.id ?? workspaceMaterial.preferredSupplierId } });
        if (intervention && body.allocateFully === true) await tx.purchaseAllocation.create({ data: { organizationId: context.workspace.id, purchaseId: created.id, purchaseLineId: createdLine.id, interventionId: intervention.id, quantityMilli: line.quantityMilli, unitCostCents: line.unitPriceCents, amountCents: line.netAmountCents, lineType: line.lineType } });
      }
      return created;
    });
    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error) { const access = getWorkspaceErrorResponse(error); if (access) return NextResponse.json(access.body, { status: access.status }); console.error("CREATE PURCHASE ERROR", error); return NextResponse.json({ error: "Impossible d’enregistrer cet achat." }, { status: 500 }); }
}
