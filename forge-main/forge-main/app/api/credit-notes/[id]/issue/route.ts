import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import {
  allocateAvailableDocumentNumber,
  isDraftReference,
} from "@/src/lib/document-numbering";
import { syncInvoicePaymentStatus } from "@/src/lib/invoice-payment-sync";

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    await requireCurrentUser();
    const context = await requireWorkspaceContext("write");
    const { id } = await params;

    const creditNote = await prisma.creditNote.findFirst({
      where: { id, organizationId: context.workspace.id },
      select: {
        id: true,
        status: true,
        reference: true,
        reason: true,
        invoiceId: true,
      },
    });

    if (!creditNote) {
      return NextResponse.json(
        { error: "Avoir introuvable." },
        { status: 404 },
      );
    }
    if (creditNote.status !== "BROUILLON") {
      return NextResponse.json(
        { error: "Cet avoir a déjà été émis." },
        { status: 409 },
      );
    }
    if (!creditNote.reason) {
      return NextResponse.json(
        { error: "Renseigne le motif avant d’émettre l’avoir." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      let reference = creditNote.reference;
      if (isDraftReference(reference)) {
        const allocated = await allocateAvailableDocumentNumber(tx, {
          organizationId: context.workspace.id,
          kind: "CREDIT_NOTE",
          prefix: context.workspace.creditNotePrefix,
          referenceExists: async (candidate) =>
            Boolean(
              await tx.creditNote.findUnique({
                where: { reference: candidate },
                select: { id: true },
              }),
            ),
        });
        reference = allocated.reference;
      }

      await tx.creditNote.update({
        where: { id: creditNote.id },
        data: { status: "EMISE", issuedAt: new Date(), reference },
      });

      // L'avoir émis réduit le reste dû de la facture.
      await syncInvoicePaymentStatus(tx, creditNote.invoiceId);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("ISSUE CREDIT NOTE ERROR", error);
    return NextResponse.json(
      { error: "Impossible d’émettre l’avoir." },
      { status: 500 },
    );
  }
}
