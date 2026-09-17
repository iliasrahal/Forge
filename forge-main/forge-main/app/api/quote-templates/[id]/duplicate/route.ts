import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id } = await params;
    const source = await prisma.quoteTemplate.findFirst({
      where: { id, active: true, OR: [{ organizationId: context.workspace.id }, { organizationId: null }] },
      include: { lines: { orderBy: { position: "asc" }, include: { details: { orderBy: { position: "asc" } } } } },
    });
    if (!source) return NextResponse.json({ error: "Ouvrage introuvable." }, { status: 404 });
    const copy = await prisma.quoteTemplate.create({ data: {
      organizationId: context.workspace.id, sourceTemplateId: source.id,
      name: `${source.name} — copie`, title: source.title, description: source.description,
      category: source.category, tradeSlugs: source.tradeSlugs, vatApplicable: source.vatApplicable,
      discountBp: source.discountBp, retentionBp: source.retentionBp,
      lines: { create: source.lines.map((line) => ({
        category: line.category, lineType: line.lineType, label: line.label, quantityMilli: line.quantityMilli,
        unit: line.unit, unitPriceCents: line.unitPriceCents, costCents: line.costCents, discountBp: line.discountBp,
        vatRateBp: line.vatRateBp, position: line.position, materialCatalogItemId: line.materialCatalogItemId,
        materialName: line.materialName, materialBrand: line.materialBrand, materialReference: line.materialReference,
        materialSpecifications: line.materialSpecifications ?? undefined, materialSupplier: line.materialSupplier,
        // Une copie globale ne reprend jamais une relation matériau privée d'un autre workspace.
        workspaceMaterialId: source.organizationId === context.workspace.id ? line.workspaceMaterialId : null,
        details: { create: line.details.map((detail) => ({ label: detail.label, description: detail.description, quantityMilli: detail.quantityMilli, unit: detail.unit, unitPriceCents: detail.unitPriceCents, amountCents: detail.amountCents, position: detail.position })) },
      })) },
    }, select: { id: true } });
    return NextResponse.json({ id: copy.id }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("DUPLICATE QUOTE TEMPLATE ERROR", error);
    return NextResponse.json({ error: "Impossible de personnaliser cet ouvrage." }, { status: 500 });
  }
}
