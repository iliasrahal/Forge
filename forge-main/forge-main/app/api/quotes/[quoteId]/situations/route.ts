import { NextResponse } from "next/server";

import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { draftReference } from "@/src/lib/document-numbering";
import {
  computeRetentionCents,
  computeSituationInvoiceAmount,
  getQuoteBillingLedger,
} from "@/src/lib/quote-billing";
import { buildFinancialInvoiceSlice, financialInvoiceLineCreateData } from "@/src/lib/financial-invoice-lines";
import { getFinancialCreationKey } from "@/src/lib/financial-idempotency";

type RouteProps = { params: Promise<{ quoteId: string }> };

class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const context = await requireWorkspaceContext("write");
    const creationKey = getFinancialCreationKey(request, `situation:${context.workspace.id}`);
    const { quoteId } = await params;
    const body = await request.json().catch(() => ({}));

    const progressPercent = Number(
      String(body.progressPercent ?? "").replace(",", "."),
    );
    if (!Number.isFinite(progressPercent) || progressPercent <= 0) {
      return NextResponse.json(
        { error: "Renseigne un avancement valide (en %)." },
        { status: 400 },
      );
    }
    const targetProgressBp = Math.round(progressPercent * 100);

    const invoice = await prisma.$transaction(
      async (tx) => {
        if (creationKey) {
          const existing = await tx.invoice.findUnique({ where: { creationKey }, select: { id: true } });
          if (existing) return existing;
        }
        const quote = await tx.quote.findFirst({
          where: {
            id: quoteId,
            organizationId: context.workspace.id,
            status: { in: ["ENVOYE", "ACCEPTE"] },
          },
          include: {
            lines: { include: { details: { orderBy: { position: "asc" } } } },
            invoices: {
              select: {
                type: true,
                status: true,
                amountCents: true,
                retentionCents: true,
              },
            },
          },
        });

        if (!quote) {
          throw new HttpError(
            "Ce devis doit être envoyé ou accepté pour être facturé à l’avancement.",
            409,
          );
        }
        if (!quote.clientId) {
          throw new HttpError(
            "Associe un client au devis avant de créer une situation.",
            400,
          );
        }

        const ledger = getQuoteBillingLedger(quote.amountCents, quote.invoices);
        const computed = computeSituationInvoiceAmount({
          quoteTtcCents: quote.amountCents,
          targetProgressBp,
          alreadyBilledCents: ledger.billedCents,
        });
        if (!computed.ok) {
          throw new HttpError(computed.error, 409);
        }

        const slice = buildFinancialInvoiceSlice({ lines: quote.lines, quoteTtcCents: quote.amountCents, targetTtcCents: computed.amountCents, vatApplicable: quote.vatApplicable, discountBp: quote.discountBp });
        const retentionCents = computeRetentionCents(
          computed.amountCents,
          quote.retentionBp,
        );
        const situationNumber = ledger.situationCount + 1;

        return tx.invoice.create({
          data: {
            reference: draftReference(),
            creationKey,
            type: "SITUATION",
            title: `Situation n°${situationNumber} - ${quote.title}`,
            description: `Situation de travaux n°${situationNumber} · avancement cumulé ${
              targetProgressBp / 100
            } % du devis ${quote.reference}`,
            amountCents: computed.amountCents,
            vatApplicable: quote.vatApplicable,
            totalHtCents: slice.totalHtCents,
            totalVatCents: slice.totalVatCents,
            discountBp: quote.discountBp,
            lines: { create: slice.lines.map(financialInvoiceLineCreateData) },
            situationProgressBp: targetProgressBp,
            retentionCents,
            status: "BROUILLON",
            quoteId: quote.id,
            clientId: quote.clientId,
            organizationId: context.workspace.id,
          },
          select: { id: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return NextResponse.json({ id: invoice.id }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "La facturation du devis vient de changer. Réessaie." },
        { status: 409 },
      );
    }
    console.error("CREATE SITUATION INVOICE ERROR", error);
    return NextResponse.json(
      { error: "Impossible de créer la situation de travaux." },
      { status: 500 },
    );
  }
}
