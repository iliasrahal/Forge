import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";



export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {

  const { id } = await params;


  try {

    const body =
      await request.json();



    const client =
      await prisma.client.update({

        where: {
          id,
        },


        data: {
          isTemporary:
            body.isTemporary ?? false,
        },

      });



    return NextResponse.json({
      success: true,
      client,
    });



  } catch (error) {


    console.error(
      "Erreur conservation client :",
      error,
    );


    return NextResponse.json(
      {
        success: false,
        error:
          "Impossible de conserver le client.",
      },
      {
        status: 500,
      },
    );

  }

}





export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {

  const { id } = await params;


  try {


    await prisma.$transaction([


      // Supprimer les interventions du client
      prisma.intervention.deleteMany({

        where: {
          clientId: id,
        },

      }),



      // Supprimer les devis du client
      prisma.quote.deleteMany({

        where: {
          clientId: id,
        },

      }),



      // Supprimer les factures du client
      prisma.invoice.deleteMany({

        where: {
          clientId: id,
        },

      }),



      // Supprimer le client
      prisma.client.delete({

        where: {
          id,
        },

      }),


    ]);



    return NextResponse.json({
      success: true,
    });



  } catch (error) {


    console.error(
      "Erreur suppression client :",
      error,
    );



    return NextResponse.json(
      {
        success: false,
        error:
          "Impossible de supprimer le client",
      },
      {
        status: 500,
      },
    );

  }

}