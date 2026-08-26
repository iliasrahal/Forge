import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/src/lib/auth";
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
        client: { userId: currentUser.id },
      },
    });

    if (!intervention) {
      return NextResponse.json(
        { error: "Cette intervention est introuvable ou non terminée." },
        { status: 404 },
      );
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { interventionId },
    });

    if (existingInvoice) {
      return NextResponse.json({ invoice: existingInvoice });
    }

    const description = [
      intervention.description,
      intervention.reportIntervention,
      intervention.reportDiagnostic,
      intervention.reportTravaux,
      intervention.reportRecommendation,
    ]
      .filter(Boolean)
      .join("\n\n");

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
      { error: "Erreur lors de la création de la facture." },
      { status: 500 },
    );
  }
}