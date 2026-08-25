import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";


export async function POST(
  request: Request,
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
        },
      );

    }


    const quote =
      await prisma.quote.findFirst({

        where: {
          id: quoteId,

          client: {
            userId: currentUser.id,
          },
        },

        include: {
          client: true,
        },

      });


    if (!quote) {

      return NextResponse.json(
        {
          error: "Devis introuvable",
        },
        {
          status: 404,
        },
      );

    }


    return NextResponse.json({
      success: true,
      quote,
    });


  } catch (error) {

    console.error(
      "SEND QUOTE ERROR",
      error,
    );


    return NextResponse.json(
      {
        error: "Erreur envoi devis",
      },
      {
        status: 500,
      },
    );

  }

}