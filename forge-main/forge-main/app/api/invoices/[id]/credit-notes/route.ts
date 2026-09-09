import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { draftReference } from "@/src/lib/document-numbering";
import { computeDocumentTotals } from "@/src/lib/vat";
import {
  buildFullCreditNoteLinesFromInvoice,
  canCreateCreditNote,
  maxCreditableCents,
  sumIssuedCreditsCents,
} from "@/src/lib/credit-notes";

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteProps) {
  try {
    await requireCurrentUser();
    const context = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const mode = body.mode === "PARTIAL" ? "PARTIAL" : "FULL";
    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim().slice(0, 500)
        : null;
    if (!reason) {
      return NextResponse.json(
        { error: "Le motif de l’avoir est obligatoire." },
        { status: 400 },
      );
    }
    const selectedLineIds: string[] = Array.isArray(body.lineIds)
      ? body.lineIds.filter((value: unknown) => typeof value === "string")
      : [];

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: context.workspace.id },
      include: {
        lines: { orderBy: { createdAt: "asc" } },
        creditNotes: { select: { status: true, amountCents: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable." },
        { status: 404 },
      );
    }

    if (!canCreateCreditNote(invoice.status)) {
      return NextResponse.json(
        {
          error:
            "Un avoir ne peut être créé que depuis une facture émise.",
        },
        { status: 409 },
      );
    }

    const sourceLines =
      mode === "FULL"
        ? invoice.lines
        : invoice.lines.filter((line) => selectedLineIds.includes(line.id));

    if (sourceLines.length === 0) {
      return NextResponse.json(
        { error: "Sélectionne au moins une ligne à créditer." },
        { status: 400 },
      );
    }

    const creditLines = buildFullCreditNoteLinesFromInvoice(sourceLines);
    // La remise de pied n'a de sens qu'en avoir total.
    const discountBp = mode === "FULL" ? invoice.discountBp : 0;
    const totals = computeDocumentTotals(
      creditLines,
      invoice.vatApplicable,
      discountBp,
    );

    const alreadyCredited = sumIssuedCreditsCents(invoice.creditNotes);
    const ceiling = maxCreditableCents(invoice.amountCents, alreadyCredited);
    if (totals.totalTtcCents > ceiling) {
      return NextResponse.json(
        {
          error: `Ce montant dépasse ce qui reste avoirable (${(
            ceiling / 100
          ).toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
          })}).`,
        },
        { status: 409 },
      );
    }

    const creditNote = await prisma.creditNote.create({
      data: {
        reference: draftReference(),
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        organizationId: context.workspace.id,
        mode,
        status: "BROUILLON",
        reason,
        vatApplicable: invoice.vatApplicable,
        amountCents: totals.totalTtcCents,
        totalHtCents: totals.totalHtCents,
        totalVatCents: totals.totalVatCents,
        discountBp,
        lines: { create: creditLines },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: creditNote.id });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    console.error("CREATE CREDIT NOTE ERROR", error);
    return NextResponse.json(
      { error: "Impossible de créer l’avoir." },
      { status: 500 },
    );
  }
}
