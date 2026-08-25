import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";


function generateInvoiceReference() {
  return `FAC-${Date.now()}`;
}


export async function POST(
  request: Request
) {

  try {

    const currentUser =
      await requireCurrentUser();


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


          client: {
            userId: currentUser.id,
          },


          status: {
            in: [
              "ENVOYE",
              "ACCEPTE",
            ],
          },

        },


        include: {
          client: true,
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
            quote.description,


          amountCents:
            quote.amountCents,


          status:
            "BROUILLON",


          quoteId:
            quote.id,


          clientId:
            quote.clientId,

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