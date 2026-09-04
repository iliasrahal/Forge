import { NextResponse } from "next/server";

import { buildInvoiceDescription } from "@/src/lib/invoiceDescription";
import { prisma } from "@/src/lib/prisma";
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
      where: { interventionId, organizationId: workspaceContext.workspace.id },
    });

    if (existingInvoice) {
      return NextResponse.json({ invoice: existingInvoice });
    }

    const description = buildInvoiceDescription(
      intervention,
    );

    const invoice = await prisma.invoice.create({
      data: {
        reference: generateInvoiceReference(),
        title: `Facture - ${intervention.title}`,
        description: description || null,
        amountCents: 0,
        status: "BROUILLON",
        interventionId: intervention.id,
        clientId: intervention.clientId,
        organizationId: workspaceContext.workspace.id,
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("CREATE INVOICE FROM INTERVENTION ERROR", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création de la facture.",
      },
      { status: 500 },
    );
  }
}
