import { NextResponse } from "next/server";
import { createQuotePublicToken, hashQuotePublicToken } from "@/src/lib/quote-public-access";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { sendQuoteEmail } from "@/src/lib/email";
import {
  allocateAvailableDocumentNumber,
  isDraftReference,
} from "@/src/lib/document-numbering";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";
import {
  resolveStoredOrProvidedClientEmail,
} from "@/src/lib/client-email";

async function ensureQuoteReference(params: {
  quoteId: string;
  organizationId: string;
  prefix: string;
}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Sérialise les envois simultanés du même devis : le second envoi
        // relit la référence définitive et ne renumérote jamais le document.
        await tx.$queryRaw`
          SELECT "id"
          FROM "Quote"
          WHERE "id" = ${params.quoteId}
          FOR UPDATE
        `;

        const currentQuote = await tx.quote.findFirst({
          where: {
            id: params.quoteId,
            organizationId: params.organizationId,
          },
          select: { reference: true },
        });

        if (!currentQuote) {
          throw new Error("Devis introuvable pendant la numérotation.");
        }

        if (!isDraftReference(currentQuote.reference)) {
          return currentQuote.reference;
        }

        const allocated = await allocateAvailableDocumentNumber(tx, {
          organizationId: params.organizationId,
          kind: "QUOTE",
          prefix: params.prefix,
          referenceExists: async (reference) => Boolean(
            await tx.quote.findUnique({
              where: { reference },
              select: { id: true },
            }),
          ),
        });

        const updated = await tx.quote.update({
          where: { id: params.quoteId },
          data: { reference: allocated.reference },
          select: { reference: true },
        });

        return updated.reference;
      });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002" && attempt < 2) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Impossible d’attribuer un numéro unique au devis.");
}


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
      email: explicitEmail,
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

    if (!quote.client) {
      return NextResponse.json(
        {
          error: "client_missing",
          message: "Associez un client au devis avant de l’envoyer.",
        },
        { status: 400 },
      );
    }

    if (quote.client.organizationId !== workspaceContext.workspace.id) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const { recipientEmail, shouldPersist } =
      resolveStoredOrProvidedClientEmail({
        clientEmail: quote.client.email,
        explicitEmail,
      });

    if (!recipientEmail) {
      return NextResponse.json(
        {
          error: explicitEmail ? "email_invalid" : "email_missing",
          message: explicitEmail
            ? "Saisis une adresse e-mail valide."
            : "Ce client n'a pas encore d'adresse e-mail.",
          clientId: quote.client.id,
        },
        { status: 400 },
      );
    }



    // Numéro définitif attribué à la première finalisation, avant le PDF.
    if (isDraftReference(quote.reference)) {
      quote.reference = await ensureQuoteReference({
        quoteId: quote.id,
        organizationId: workspaceContext.workspace.id,
        prefix: workspaceContext.workspace.quotePrefix,
      });
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
        recipientEmail,
        clientName,
        artisanSignature,
        quote.title,
        quote.reference,
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
    const finalizationOperations = [
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
    ];

    if (shouldPersist) {
      finalizationOperations.push(
        prisma.client.updateMany({
          where: {
            id: quote.client.id,
            organizationId: workspaceContext.workspace.id,
          },
          data: { email: recipientEmail },
        }),
      );
    }

    await prisma.$transaction(finalizationOperations);



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
        error: "Impossible d’envoyer le devis pour le moment. Réessayez.",
      },
      {
        status: 500,
      },
    );

  }
}
