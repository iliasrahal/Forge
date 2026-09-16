import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";
import { draftReference } from "@/src/lib/document-numbering";
import { computeDocumentTotals } from "@/src/lib/vat";
import { buildFullCreditNoteLinesFromInvoice, canCreateCreditNote, maxCreditableCents, sumIssuedCreditsCents } from "@/src/lib/credit-notes";
import { getFinancialCreationKey } from "@/src/lib/financial-idempotency";

type RouteProps = { params: Promise<{ id: string }> };
class CreditError extends Error { constructor(message: string, readonly status: number) { super(message); } }

export async function POST(request: Request, { params }: RouteProps) {
  try {
    await requireCurrentUser();
    const context = await requireWorkspaceContext("write");
    const creationKey = getFinancialCreationKey(request, `credit:${context.workspace.id}`);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const mode = body.mode === "PARTIAL" ? "PARTIAL" : "FULL";
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 500) : null;
    const selectedLineIds: string[] = Array.isArray(body.lineIds) ? body.lineIds.filter((value: unknown) => typeof value === "string") : [];
    if (!reason) throw new CreditError("Le motif de l’avoir est obligatoire.", 400);

    const result = await prisma.$transaction(async (tx) => {
      if (creationKey) {
        const existing = await tx.creditNote.findUnique({ where: { creationKey }, select: { id: true } });
        if (existing) return existing;
      }
      const invoice = await tx.invoice.findFirst({
        where: { id, organizationId: context.workspace.id },
        include: { lines: { orderBy: { createdAt: "asc" } }, creditNotes: { select: { status: true, amountCents: true } } },
      });
      if (!invoice) throw new CreditError("Facture introuvable.", 404);
      if (!canCreateCreditNote(invoice.status)) throw new CreditError("Un avoir ne peut être créé que depuis une facture émise.", 409);
      const sourceLines = mode === "FULL" ? invoice.lines : invoice.lines.filter((line) => selectedLineIds.includes(line.id));
      if (!sourceLines.length) throw new CreditError("Sélectionne au moins une ligne à créditer.", 400);
      const creditLines = buildFullCreditNoteLinesFromInvoice(sourceLines);
      const discountBp = mode === "FULL" ? invoice.discountBp : 0;
      const totals = computeDocumentTotals(creditLines, invoice.vatApplicable, discountBp);
      const ceiling = maxCreditableCents(invoice.amountCents, sumIssuedCreditsCents(invoice.creditNotes));
      if (totals.totalTtcCents > ceiling) throw new CreditError(`Ce montant dépasse ce qui reste avoirable (${(ceiling / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}).`, 409);
      return tx.creditNote.create({
        data: {
          reference: draftReference(), creationKey, invoiceId: invoice.id, clientId: invoice.clientId,
          organizationId: context.workspace.id, mode, status: "BROUILLON", reason,
          vatApplicable: invoice.vatApplicable, amountCents: totals.totalTtcCents,
          totalHtCents: totals.totalHtCents, totalVatCents: totals.totalVatCents,
          discountBp, lines: { create: creditLines },
        },
        select: { id: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(result);
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    if (error instanceof CreditError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || error.code === "P2002")) {
      return NextResponse.json({ error: "La facture ou ses avoirs viennent de changer. Réessaie." }, { status: 409 });
    }
    console.error("CREATE CREDIT NOTE ERROR", error);
    return NextResponse.json({ error: "Impossible de créer l’avoir." }, { status: 500 });
  }
}
