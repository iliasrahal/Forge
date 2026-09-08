import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { cleanInvoiceDescriptionValue } from "@/src/lib/invoiceDescription";
import { buildInvoiceSnapshotFromQuote } from "@/src/lib/quote-invoice-snapshot";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

import { draftReference } from "@/src/lib/document-numbering";

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

    const invoice = await prisma.invoice.create({
      data: {
        reference: generateInvoiceReference(),

        title: snapshot.title,

        description:
          cleanInvoiceDescriptionValue(snapshot.description) || null,

        amountCents: snapshot.amountCents,

        status: "BROUILLON",

        type: "STANDARD",

        quote: { connect: { id: quote.id } },

        client: { connect: { id: quote.clientId } },

        organization: { connect: { id: workspaceContext.workspace.id } },

        // Chaque ligne du devis est copiée dans la facture.
        // Ensuite les deux documents sont totalement indépendants.
        lines: {
          create: snapshot.lines.map((line) => ({
            category: line.category,
            label: line.label,
            quantityMilli: line.quantityMilli,
            unit: line.unit,
            unitPriceCents: line.unitPriceCents,
            costCents: line.costCents,
            discountBp: line.discountBp,
            amountCents: line.amountCents,
            vatRateBp: line.vatRateBp,
            ...(line.details ? { details: line.details } : {}),
          })),
        },

        vatApplicable: snapshot.vatApplicable,
        totalHtCents: snapshot.totalHtCents,
        totalVatCents: snapshot.totalVatCents,
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
