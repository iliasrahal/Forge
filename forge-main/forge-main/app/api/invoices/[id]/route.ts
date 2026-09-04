import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type InvoiceRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: InvoiceRouteProps,
) {
  try {
    const workspaceContext = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();
    const amount =
      typeof body.amount === "number"
        ? body.amount
        : Number(body.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { error: "Le montant est invalide." },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: workspaceContext.workspace.id,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable." },
        { status: 404 },
      );
    }

    if (invoice.status !== "BROUILLON") {
      return NextResponse.json(
        {
          error:
            "Seule une facture en brouillon peut être modifiée.",
        },
        { status: 409 },
      );
    }

    if (invoice.type === "DEPOSIT") {
      return NextResponse.json(
        {
          error:
            "Le montant d’une facture d’acompte est défini depuis le devis.",
        },
        { status: 409 },
      );
    }

    if (invoice.vatApplicable) {
      return NextResponse.json(
        {
          error:
            "Le montant d’une facture avec TVA se règle depuis le devis d’origine.",
        },
        { status: 409 },
      );
    }

    const amountCents = Math.round(amount * 100);
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      // Sans TVA : HT = TTC, TVA = 0.
      data: { amountCents, totalHtCents: amountCents, totalVatCents: 0 },
    });

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("UPDATE INVOICE ERROR", error);

    return NextResponse.json(
      { error: "Impossible d’enregistrer le montant." },
      { status: 500 },
    );
  }
}
