import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { syncInvoicePaymentStatus } from "@/src/lib/invoice-payment-sync";

type PaymentRouteProps = {
  params: Promise<{ id: string; paymentId: string }>;
};

export async function DELETE(_request: Request, { params }: PaymentRouteProps) {
  try {
    const workspaceContext = await requireWorkspaceContext("write");
    const { id, paymentId } = await params;

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        invoiceId: id,
        organizationId: workspaceContext.workspace.id,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Paiement introuvable." },
        { status: 404 },
      );
    }

    if (payment.provider !== "MANUAL") {
      return NextResponse.json(
        {
          error:
            "Un paiement en ligne se rembourse depuis Stripe, il ne peut pas être supprimé ici.",
        },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id: payment.id } });
      return syncInvoicePaymentStatus(tx, id);
    });

    return NextResponse.json({
      ok: true,
      state: result?.state ?? null,
      status: result?.status ?? null,
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("DELETE PAYMENT ERROR", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le paiement." },
      { status: 500 },
    );
  }
}
