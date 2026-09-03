import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";
import { sendInvoiceEmail } from "@/src/lib/email";
import {
  buildInvoiceDescriptionSections,
  parseInvoiceDescriptionSections,
} from "@/src/lib/invoiceDescription";
import { resolveClientEmail } from "@/src/lib/client-email";


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
      invoiceId,
      email: explicitEmail,
    } = body;



    if (!invoiceId) {

      return NextResponse.json(
        {
          error: "invoice_missing",
        },
        {
          status: 400,
        },
      );

    }



    const invoice =
      await prisma.invoice.findFirst({

        where: {

          id: invoiceId,

          organizationId: workspaceContext.workspace.id,

        },

        include: {
          client: true,
          intervention: true,
        },

      });



    if (!invoice) {

      return NextResponse.json(
        {
          error: "Facture introuvable",
        },
        {
          status: 404,
        },
      );

    }



    if (
      invoice.client.organizationId !==
      workspaceContext.workspace.id
    ) {

      return NextResponse.json(
        {
          error: "Facture introuvable",
        },
        {
          status: 404,
        },
      );

    }

    const recipientEmail = resolveClientEmail({
      explicitEmail,
      clientEmail: invoice.client.email,
    });

    if (!recipientEmail) {

      return NextResponse.json(
        {
          error: "email_missing",
        },
        {
          status: 400,
        },
      );

    }



    /*
      Génération du PDF facture
    */

    const origin =
      new URL(request.url).origin;


    const pdfResponse =
      await fetch(
        `${origin}/api/invoices/${invoice.id}/pdf`,
        {
          headers: {
            cookie:
              request.headers.get("cookie") ?? "",
          },
        },
      );



    if (!pdfResponse.ok) {

      throw new Error(
        "Impossible de générer le PDF facture",
      );

    }



    const pdfBuffer =
      Buffer.from(
        await pdfResponse.arrayBuffer(),
      );



    const clientName =
      invoice.client.type === "PARTICULIER"
        ? invoice.client.firstName?.trim() ||
          `${invoice.client.firstName ?? ""} ${
            invoice.client.lastName ?? ""
          }`.trim() ||
          "Madame, Monsieur"
        : invoice.client.companyName?.trim() ||
          "Madame, Monsieur";

    const artisanSignature =
      currentUser.emailSignature?.trim() ||
      currentUser.firstName?.trim() ||
      "L'équipe Forge";

    const generatedInterventionSections =
      invoice.intervention
        ? buildInvoiceDescriptionSections(
            invoice.intervention,
          )
        : parseInvoiceDescriptionSections(
            invoice.description?.trim() ||
              invoice.title.trim(),
          );
    const interventionSections =
      generatedInterventionSections.length > 0
        ? generatedInterventionSections
        : parseInvoiceDescriptionSections(
            invoice.title,
          );



    await sendInvoiceEmail(
      recipientEmail,
      clientName,
      artisanSignature,
      invoice.reference,
      interventionSections,
      pdfBuffer,
      `facture-${invoice.reference}.pdf`,
    );



    await prisma.invoice.update({

      where: {
        id: invoice.id,
      },

      data: {
        status: "ENVOYEE",
      },

    });



    return NextResponse.json({

      success: true,

      message:
        "Facture envoyée avec succès",

    });



  } catch (error) {

    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });


    console.error(
      "SEND INVOICE ERROR",
      error,
    );


    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur envoi facture",
      },
      {
        status: 500,
      },
    );

  }

}
