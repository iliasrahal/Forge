import { NextResponse } from "next/server";

import { buildInvoiceDescription } from "@/src/lib/invoiceDescription";
import { prisma } from "@/src/lib/prisma";
import { buildInvoiceSnapshotFromQuote } from "@/src/lib/quote-invoice-snapshot";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

import { draftReference } from "@/src/lib/document-numbering";

function generateInvoiceReference() {
  return draftReference();
}

export async function POST(request: Request) {
  try {
    const workspaceContext = await requireWorkspaceContext("write");
    const body = await request.json();
    const interventionId =
      typeof body.interventionId === "string"
        ? body.interventionId.trim()
        : "";

    if (!interventionId) {
      return NextResponse.json(
        { error: "Intervention manquante." },
        { status: 400 },
      );
    }

    const intervention = await prisma.intervention.findFirst({
      where: {
        id: interventionId,
        status: "TERMINEE",
        organizationId: workspaceContext.workspace.id,
      },
      include: {
        quote: { include: { lines: true } },
      },
    });

    if (!intervention) {
      return NextResponse.json(
        { error: "Cette intervention est introuvable ou non terminée." },
        { status: 404 },
      );
    }

    if (!intervention.clientId) {
      return NextResponse.json(
        { error: "Ajoute un client avant de créer une facture." },
        { status: 400 },
      );
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        organizationId: workspaceContext.workspace.id,
        type: "STANDARD",
        OR: [
          { interventionId },
          ...(intervention.quoteId ? [{ quoteId: intervention.quoteId }] : []),
        ],
      },
    });

    if (existingInvoice) {
      return NextResponse.json({ invoice: existingInvoice });
    }

    const description = buildInvoiceDescription(intervention);
    const quoteSnapshot = intervention.quote
      ? buildInvoiceSnapshotFromQuote(intervention.quote)
      : null;

    const invoice = await prisma.invoice.create({
      data: {
        reference: generateInvoiceReference(),
        title: quoteSnapshot?.title ?? `Facture - ${intervention.title || "Intervention"}`,
        description: description || quoteSnapshot?.description || null,
        amountCents: quoteSnapshot?.amountCents ?? 0,
        status: "BROUILLON",
        type: "STANDARD",
        ...(intervention.quoteId
          ? { quote: { connect: { id: intervention.quoteId } } }
          : {}),
        intervention: { connect: { id: intervention.id } },
        client: { connect: { id: intervention.clientId } },
        organization: { connect: { id: workspaceContext.workspace.id } },
        vatApplicable: quoteSnapshot?.vatApplicable ?? false,
        totalHtCents: quoteSnapshot?.totalHtCents ?? 0,
        totalVatCents: quoteSnapshot?.totalVatCents ?? 0,
        discountBp: quoteSnapshot?.discountBp ?? 0,
        totalCostCents: quoteSnapshot?.totalCostCents ?? 0,
        ...(quoteSnapshot
          ? {
              lines: {
                create: quoteSnapshot.lines,
              },
            }
          : {}),
      },
      include: { lines: true },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("CREATE INVOICE FROM INTERVENTION ERROR", error);

    return NextResponse.json(
      {
        error: "Impossible de créer la facture pour le moment. Réessayez.",
      },
      { status: 500 },
    );
  }
}
