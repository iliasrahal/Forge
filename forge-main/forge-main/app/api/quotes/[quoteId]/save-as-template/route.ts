import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

type RouteProps = { params: Promise<{ quoteId: string }> };

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const context = await requireWorkspaceContext("write");
    const { quoteId } = await params;
    const body = await request.json().catch(() => ({}));
    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 120)
        : "";

    if (!name) {
      return NextResponse.json(
        { error: "Donne un nom au modèle." },
        { status: 400 },
      );
    }

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, organizationId: context.workspace.id },
      include: { lines: { orderBy: { createdAt: "asc" } } },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Devis introuvable." },
        { status: 404 },
      );
    }
    if (quote.lines.length === 0) {
      return NextResponse.json(
        { error: "Ce devis n’a pas de ligne à enregistrer." },
        { status: 409 },
      );
    }

    const template = await prisma.quoteTemplate.create({
      data: {
        organizationId: context.workspace.id,
        name,
        title: quote.title,
        description: quote.description || null,
        vatApplicable: quote.vatApplicable,
        discountBp: quote.discountBp,
        retentionBp: quote.retentionBp,
        lines: {
          create: quote.lines.map((line, position) => ({
            category: line.category,
            label: line.label,
            quantityMilli: line.quantityMilli,
            unit: line.unit,
            unitPriceCents: line.unitPriceCents,
            costCents: line.costCents,
            discountBp: line.discountBp,
            vatRateBp: line.vatRateBp,
            position,
          })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: template.id });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("SAVE QUOTE AS TEMPLATE ERROR", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer le modèle." },
      { status: 500 },
    );
  }
}
