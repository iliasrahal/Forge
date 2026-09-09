import { NextResponse } from "next/server";

import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";
import { draftReference } from "@/src/lib/document-numbering";
import {
  computeBalanceInvoiceAmount,
  computeRetentionCents,
  getQuoteBillingLedger,
} from "@/src/lib/quote-billing";
import { ventilateQuoteAmount } from "@/src/lib/quote-invoice-vat";

type RouteProps = { params: Promise<{ quoteId: string }> };

class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    const context = await requireWorkspaceContext("write");
    const { quoteId } = await params;

    const invoice = await prisma.$transaction(
      async (tx) => {
        const quote = await tx.quote.findFirst({
          where: {
            id: quoteId,
            organizationId: context.workspace.id,
            status: { in: ["ENVOYE", "ACCEPTE"] },
          },
          include: {
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
            "Ce devis doit être envoyé ou accepté pour être soldé.",
            409,
          );
        }
        if (!quote.clientId) {
          throw new HttpError(
            "Associe un client au devis avant de créer la facture de solde.",
            400,
          );
        }

        const ledger = getQuoteBillingLedger(quote.amountCents, quote.invoices);
        const amountCents = computeBalanceInvoiceAmount(
          quote.amountCents,
          ledger.billedCents,
        );
        if (amountCents <= 0) {
          throw new HttpError("Ce devis est déjà entièrement facturé.", 409);
        }

        const { totalHtCents, totalVatCents } = ventilateQuoteAmount({
          amountTtcCents: amountCents,
          vatApplicable: quote.vatApplicable,
          quoteTotalHtCents: quote.totalHtCents,
          quoteTotalVatCents: quote.totalVatCents,
        });
        const retentionCents = computeRetentionCents(
          amountCents,
          quote.retentionBp,
        );

        return tx.invoice.create({
          data: {
            reference: draftReference(),
            type: "BALANCE",
            title: `Facture de solde - ${quote.title}`,
            description: `Solde du devis ${quote.reference}`,
            amountCents,
            vatApplicable: quote.vatApplicable,
            totalHtCents,
            totalVatCents,
            situationProgressBp: 10000,
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
    console.error("CREATE BALANCE INVOICE ERROR", error);
    return NextResponse.json(
      { error: "Impossible de créer la facture de solde." },
      { status: 500 },
    );
  }
}
