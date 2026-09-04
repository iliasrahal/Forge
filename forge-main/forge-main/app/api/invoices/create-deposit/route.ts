import { NextResponse } from "next/server";

import { Prisma } from "@/src/generated/prisma/client";
import {
  calculateDepositAmount,
  DEPOSIT_MODES,
  getQuoteDepositSummary,
  type DepositMode,
} from "@/src/lib/deposits";
import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

function generateInvoiceReference() {
  return `FAC-${Date.now()}`;
}

class DepositCreationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const body = (await request.json()) as Record<string, unknown>;
    const quoteId = typeof body.quoteId === "string" ? body.quoteId.trim() : "";
    const mode = DEPOSIT_MODES.includes(body.mode as DepositMode)
      ? (body.mode as DepositMode)
      : null;

    if (!quoteId || !mode) {
      return NextResponse.json(
        { error: "Les informations de l’acompte sont incomplètes." },
        { status: 400 },
      );
    }

    const invoice = await prisma.$transaction(
      async (transaction) => {
        const quote = await transaction.quote.findFirst({
          where: {
            id: quoteId,
            organizationId: context.workspace.id,
            status: { not: "REFUSE" },
          },
          include: {
            invoices: {
              select: { type: true, status: true, amountCents: true },
            },
          },
        });

        if (!quote) {
          throw new DepositCreationError("Ce devis est introuvable ou refusé.", 404);
        }

        const summary = getQuoteDepositSummary(quote.amountCents, quote.invoices);
        const calculation = calculateDepositAmount({
          mode,
          value: body.value,
          quoteTotalCents: quote.amountCents,
          alreadyDepositedCents: summary.depositedCents,
        });

        if (!calculation.ok) {
          throw new DepositCreationError(calculation.error, 400);
        }

        // L'acompte est un % du TTC du devis. Quand le devis porte la TVA,
        // on ventile l'acompte au taux effectif du devis (TVA / HT).
        const depositTtc = calculation.amountCents;
        let depositHt = depositTtc;
        let depositVat = 0;
        if (quote.vatApplicable && quote.totalHtCents > 0) {
          const effectiveRateBp = Math.round(
            (quote.totalVatCents * 10000) / quote.totalHtCents,
          );
          depositHt = Math.round(
            (depositTtc * 10000) / (10000 + effectiveRateBp),
          );
          depositVat = depositTtc - depositHt;
        }

        return transaction.invoice.create({
          data: {
            reference: generateInvoiceReference(),
            type: "DEPOSIT",
            title: `Facture d’acompte - ${quote.title}`,
            description: `Acompte relatif au devis ${quote.reference}`,
            amountCents: depositTtc,
            vatApplicable: quote.vatApplicable,
            totalHtCents: depositHt,
            totalVatCents: depositVat,
            status: "BROUILLON",
            quoteId: quote.id,
            clientId: quote.clientId,
            organizationId: context.workspace.id,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return NextResponse.json(accessError.body, { status: accessError.status });
    }
    if (error instanceof DepositCreationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Le montant restant vient de changer. Réessayez avec la valeur actualisée." },
        { status: 409 },
      );
    }

    console.error("CREATE DEPOSIT INVOICE ERROR", error);
    return NextResponse.json(
      { error: "Impossible de créer cette facture d’acompte." },
      { status: 500 },
    );
  }
}
