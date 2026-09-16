import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { cleanInvoiceDescriptionValue } from "@/src/lib/invoiceDescription";
import { buildInvoiceSnapshotFromQuote } from "@/src/lib/quote-invoice-snapshot";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

import { draftReference } from "@/src/lib/document-numbering";
import { getQuoteBillingLedger } from "@/src/lib/quote-billing";
import { buildFinancialInvoiceSlice, financialInvoiceLineCreateData } from "@/src/lib/financial-invoice-lines";

function generateInvoiceReference() {
  return draftReference();
}

export async function POST(request: Request) {
  try {
    const workspaceContext = await requireWorkspaceContext("write");

    const body = await request.json();

    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json(
        {
          error: "Devis manquant",
        },
        {
          status: 400,
        },
      );
    }

    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        organizationId: workspaceContext.workspace.id,
        status: {
          not: "REFUSE",
        },
      },

      include: {
        client: true,
        lines: { include: { details: { orderBy: { position: "asc" } } } },
        invoices: { select: { type: true, status: true, amountCents: true, retentionCents: true } },
      },
    });

    if (!quote) {
      return NextResponse.json(
        {
          error: "Ce devis n'existe pas ou n'est pas envoyé",
        },
        {
          status: 404,
        },
      );
    }

    if (!quote.clientId) {
      return NextResponse.json(
        { error: "Associez un client au devis avant de créer une facture." },
        { status: 400 },
      );
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        quoteId: quote.id,
        type: "STANDARD",
        organizationId: workspaceContext.workspace.id,
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        {
          invoice: existingInvoice,
        },
        {
          status: 200,
        },
      );
    }

    const snapshot = buildInvoiceSnapshotFromQuote(quote);
    const ledger = getQuoteBillingLedger(quote.amountCents, quote.invoices);
    if (ledger.remainingCents <= 0) {
      return NextResponse.json({ error: "Ce devis est déjà entièrement facturé." }, { status: 409 });
    }
    const isBalance = ledger.billedCents > 0;
    const slice = isBalance ? buildFinancialInvoiceSlice({ lines: quote.lines, quoteTtcCents: quote.amountCents, targetTtcCents: ledger.remainingCents, vatApplicable: quote.vatApplicable, discountBp: quote.discountBp }) : null;

    const invoice = await prisma.invoice.create({
      data: {
        reference: generateInvoiceReference(),

        title: isBalance ? `Facture de solde - ${quote.title}` : snapshot.title,

        description:
          cleanInvoiceDescriptionValue(snapshot.description) || null,

        amountCents: slice?.totalTtcCents ?? snapshot.amountCents,

        status: "BROUILLON",

        type: isBalance ? "BALANCE" : "STANDARD",

        quote: { connect: { id: quote.id } },

        client: { connect: { id: quote.clientId } },

        organization: { connect: { id: workspaceContext.workspace.id } },

        // Chaque ligne du devis est copiée dans la facture.
        // Ensuite les deux documents sont totalement indépendants.
        lines: {
          create: slice ? slice.lines.map(financialInvoiceLineCreateData) : snapshot.lines.map((line) => ({
            lineType: line.lineType,
            category: line.category,
            label: line.label,
            quantityMilli: line.quantityMilli,
            unit: line.unit,
            unitPriceCents: line.unitPriceCents,
            costCents: line.costCents,
            discountBp: line.discountBp,
            amountCents: line.amountCents,
            vatRateBp: line.vatRateBp,
            materialCatalogItemId: line.materialCatalogItemId,
            workspaceMaterialId: line.workspaceMaterialId,
            materialName: line.materialName,
            materialBrand: line.materialBrand,
            materialReference: line.materialReference,
            materialSpecifications: line.materialSpecifications,
            materialSupplier: line.materialSupplier,
            sourceWorkTemplateId: line.sourceWorkTemplateId,
            sourceWorkTemplateName: line.sourceWorkTemplateName,
            sourceWorkTemplateVersionAt: line.sourceWorkTemplateVersionAt,
            ...(line.details ? { details: line.details } : {}),
          })),
        },

        vatApplicable: snapshot.vatApplicable,
        totalHtCents: slice?.totalHtCents ?? snapshot.totalHtCents,
        totalVatCents: slice?.totalVatCents ?? snapshot.totalVatCents,
        discountBp: snapshot.discountBp,
        totalCostCents: snapshot.totalCostCents,
      },

      include: {
        lines: { include: { details: true } },
      },
    });

    return NextResponse.json(
      {
        invoice,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);

    if (accessError) {
      return NextResponse.json(accessError.body, {
        status: accessError.status,
      });
    }

    console.error("CREATE INVOICE ERROR", error);

    return NextResponse.json(
      {
        error: "Impossible de créer la facture pour le moment. Réessayez.",
      },
      {
        status: 500,
      },
    );
  }
}
