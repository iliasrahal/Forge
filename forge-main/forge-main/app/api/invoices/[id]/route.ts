import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

type InvoiceRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: InvoiceRouteProps,
) {
  try {
    const currentUser = await requireCurrentUser();
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
        client: { userId: currentUser.id },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable." },
        { status: 404 },
      );
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { amountCents: Math.round(amount * 100) },
    });

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error("UPDATE INVOICE ERROR", error);

    return NextResponse.json(
      { error: "Impossible d’enregistrer le montant." },
      { status: 500 },
    );
  }
}
