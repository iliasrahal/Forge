import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/src/lib/auth";
import { buildInvoiceDescription } from "@/src/lib/invoiceDescription";
import { prisma } from "@/src/lib/prisma";

function generateInvoiceReference() {
  return `FAC-${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireCurrentUser();
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
        OR: [
          { userId: currentUser.id },
          { client: { userId: currentUser.id } },
        ],
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
      where: { interventionId },
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
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
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
