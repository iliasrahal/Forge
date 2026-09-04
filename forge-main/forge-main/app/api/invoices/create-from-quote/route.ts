import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { cleanInvoiceDescriptionValue } from "@/src/lib/invoiceDescription";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";


import { draftReference } from "@/src/lib/document-numbering";

function generateInvoiceReference() {
  return draftReference();
}


export async function POST(
  request: Request
) {

  try {

    const workspaceContext = await requireWorkspaceContext("write");


    const body =
      await request.json();


    const {
      quoteId,
    } = body;



    if (!quoteId) {

      return NextResponse.json(
        {
          error: "Devis manquant",
        },
        {
          status: 400,
        }
      );

    }



    const quote =
      await prisma.quote.findFirst({

        where: {

          id: quoteId,


          organizationId: workspaceContext.workspace.id,


          status: {
            not: "REFUSE",
          },

        },


        include: {
          client: true,
          lines: true,
        },

      });



    if (!quote) {

      return NextResponse.json(
        {
          error:
            "Ce devis n'existe pas ou n'est pas envoyé",
        },
        {
          status: 404,
        }
      );

    }



    const existingInvoice =
      await prisma.invoice.findFirst({

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
        }
      );

    }



    const invoice =
      await prisma.invoice.create({

        data: {

          reference:
            generateInvoiceReference(),


          title:
            `Facture - ${quote.title}`,


          description:
            cleanInvoiceDescriptionValue(
              quote.description,
            ) || null,


          amountCents:
            quote.amountCents,

          vatApplicable: quote.vatApplicable,
          totalHtCents: quote.totalHtCents,
          totalVatCents: quote.totalVatCents,
          discountBp: quote.discountBp,
          totalCostCents: quote.totalCostCents,

          lines: {
            create: quote.lines.map((line) => ({
              category: line.category,
              label: line.label,
              quantityMilli: line.quantityMilli,
              unit: line.unit,
              unitPriceCents: line.unitPriceCents,
              costCents: line.costCents,
              discountBp: line.discountBp,
              amountCents: line.amountCents,
              vatRateBp: line.vatRateBp,
            })),
          },


          status:
            "BROUILLON",

          type: "STANDARD",


          quoteId:
            quote.id,


          clientId:
            quote.clientId,
          organizationId: workspaceContext.workspace.id,

        },

      });



    return NextResponse.json(
      {
        invoice,
      },
      {
        status: 201,
      }
    );


  } catch (error) {

    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });


    console.error(
      "CREATE INVOICE ERROR",
      error
    );


    return NextResponse.json(
      {
        error:
          "Erreur lors de la création de la facture",
      },
      {
        status: 500,
      }
    );

  }

}
