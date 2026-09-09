import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { draftReference } from "@/src/lib/document-numbering";
import {
  computeLineAmountCents,
  computeLineCostCents,
} from "@/src/lib/document-lines";
import { computeDocumentTotals } from "@/src/lib/vat";
import { getQuotePath } from "@/src/lib/quote-routes";

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const body = await request.json().catch(() => ({}));
    const templateId =
      typeof body.templateId === "string" ? body.templateId : "";

    if (!templateId) {
      return NextResponse.json(
        { error: "Modèle manquant." },
        { status: 400 },
      );
    }

    const template = await prisma.quoteTemplate.findFirst({
      where: { id: templateId, organizationId: context.workspace.id },
      include: { lines: { orderBy: { position: "asc" } } },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Modèle introuvable." },
        { status: 404 },
      );
    }

    const persistedLines = template.lines.map((line) => ({
      category: line.category,
      label: line.label,
      quantityMilli: line.quantityMilli,
      unit: line.unit,
      unitPriceCents: line.unitPriceCents,
      costCents: line.costCents,
      discountBp: line.discountBp,
      vatRateBp: line.vatRateBp,
      amountCents: computeLineAmountCents(line),
    }));
    const totals = computeDocumentTotals(
      persistedLines,
      template.vatApplicable,
      template.discountBp,
    );
    const totalCostCents = template.lines.reduce(
      (sum, line) => sum + computeLineCostCents(line),
      0,
    );

    const quote = await prisma.quote.create({
      data: {
        reference: draftReference(),
        title: template.title,
        description: template.description ?? "",
        amountCents: totals.totalTtcCents,
        vatApplicable: template.vatApplicable,
        totalHtCents: totals.totalHtCents,
        totalVatCents: totals.totalVatCents,
        discountBp: template.discountBp,
        retentionBp: template.retentionBp,
        totalCostCents,
        status: "BROUILLON",
        organizationId: context.workspace.id,
        lines: { create: persistedLines },
      },
      select: { id: true, clientId: true },
    });

    return NextResponse.json({
      id: quote.id,
      path: getQuotePath(quote),
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("QUOTE FROM TEMPLATE ERROR", error);
    return NextResponse.json(
      { error: "Impossible de créer le devis depuis ce modèle." },
      { status: 500 },
    );
  }
}
