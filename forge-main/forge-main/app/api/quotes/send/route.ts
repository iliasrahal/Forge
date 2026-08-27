import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { sendQuoteEmail } from "@/src/lib/email";


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



    // Vérification email client
    if (!quote.client.email) {

      return NextResponse.json(
        {
          error: "email_missing",
          message:
            "Ce client n'a pas encore d'adresse email.",
          clientId: quote.client.id,
        },
        {
          status: 400,
        },
      );

    }



    /*
      Génération du PDF
    */

    const origin =
      new URL(request.url).origin;


    const pdfResponse =
      await fetch(
        `${origin}/api/quotes/${quote.id}/pdf`,
      );


    if (!pdfResponse.ok) {

      throw new Error(
        "Impossible de générer le PDF",
      );

    }



    const pdfBuffer =
      Buffer.from(
        await pdfResponse.arrayBuffer(),
      );



    const clientName =
      quote.client.type === "PARTICULIER"
        ? quote.client.firstName?.trim() ||
          `${quote.client.firstName ?? ""} ${
            quote.client.lastName ?? ""
          }`.trim() ||
          "Madame, Monsieur"
        : quote.client.companyName?.trim() ||
          "Madame, Monsieur";

    const artisanName =
      currentUser.firstName?.trim() ||
      "L'équipe Forge";

    const quoteDescription =
      quote.description?.trim() ||
      quote.title.trim();



    await sendQuoteEmail(
      quote.client.email,
      clientName,
      artisanName,
      quote.title,
      quoteDescription,
      pdfBuffer,
      `devis-${quote.reference}.pdf`,
    );



    await prisma.quote.update({

      where: {
        id: quote.id,
      },

      data: {
        status: "ENVOYE",
      },

    });



    return NextResponse.json({

      success: true,

      message:
        "Devis envoyé avec succès",

    });



  } catch (error) {


    console.error(
      "SEND QUOTE ERROR",
      error,
    );


    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur envoi devis",
      },
      {
        status: 500,
      },
    );

  }
}
