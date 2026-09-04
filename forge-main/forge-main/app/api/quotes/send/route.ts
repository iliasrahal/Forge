import { NextResponse } from "next/server";
import { createQuotePublicToken, hashQuotePublicToken } from "@/src/lib/quote-public-access";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { sendQuoteEmail } from "@/src/lib/email";
import {
  allocateDocumentNumber,
  isDraftReference,
} from "@/src/lib/document-numbering";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";


export async function POST(
  request: Request,
) {
  try {

    const currentUser =
      await requireCurrentUser();
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
        },
      );

    }


    const quote =
      await prisma.quote.findFirst({

        where: {
          id: quoteId,

          organizationId: workspaceContext.workspace.id,
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

    if (quote.status === "REFUSE") {
      return NextResponse.json(
        { error: "Un devis refusé ne peut pas être renvoyé." },
        { status: 409 },
      );
    }



    // Numéro définitif attribué à la première finalisation, avant le PDF.
    if (isDraftReference(quote.reference)) {
      const allocated = await prisma.$transaction((tx) =>
        allocateDocumentNumber(tx, {
          organizationId: workspaceContext.workspace.id,
          kind: "QUOTE",
          prefix: workspaceContext.workspace.quotePrefix,
        }),
      );
      await prisma.quote.update({
        where: { id: quote.id },
        data: { reference: allocated.reference },
      });
      quote.reference = allocated.reference;
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
        { headers: { cookie: request.headers.get("cookie") ?? "" } },
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

    const artisanSignature =
      currentUser.emailSignature?.trim() ||
      currentUser.firstName?.trim() ||
      "L'équipe Forge";

    const quoteDescription =
      quote.description?.trim() ||
      quote.title.trim();

    const rawPublicToken = createQuotePublicToken();
    const publicAccess = await prisma.quotePublicAccess.create({
      data: {
        quoteId: quote.id,
        tokenHash: hashQuotePublicToken(rawPublicToken),
      },
      select: { id: true },
    });
    const publicQuoteUrl = `${origin}/quote/view/${rawPublicToken}`;

    try {
      const delivery = await sendQuoteEmail(
        quote.client.email,
        clientName,
        artisanSignature,
        quote.title,
        quote.reference,
        quoteDescription,
        publicQuoteUrl,
        pdfBuffer,
        `devis-${quote.reference}.pdf`,
      );
      if (delivery.error) {
        throw new Error("L’e-mail du devis n’a pas pu être envoyé.");
      }
    } catch (emailError) {
      await prisma.quotePublicAccess.delete({ where: { id: publicAccess.id } });
      throw emailError;
    }



    const sentAt = new Date();
    await prisma.$transaction([
      prisma.quotePublicAccess.updateMany({
        where: {
          quoteId: quote.id,
          id: { not: publicAccess.id },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
      prisma.quote.update({
        where: { id: quote.id },
        data: quote.status === "ACCEPTE"
          ? { sentAt }
          : { status: "ENVOYE", sentAt },
      }),
    ]);



    return NextResponse.json({

      success: true,

      message:
        "Devis envoyé avec succès",

    });



  } catch (error) {

    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });


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
