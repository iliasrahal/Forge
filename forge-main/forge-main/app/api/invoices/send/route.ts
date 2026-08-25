import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import { sendInvoiceEmail } from "@/src/lib/email";


export async function POST(
  request: Request,
) {

  try {

    const currentUser =
      await requireCurrentUser();


    const body =
      await request.json();


    const {
      invoiceId,
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

          client: {
            userId: currentUser.id,
          },

        },

        include: {
          client: true,
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



    if (!invoice.client.email) {

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

        ? `${invoice.client.firstName ?? ""} ${
            invoice.client.lastName ?? ""
          }`.trim() || "Client"

        : invoice.client.companyName ?? "Client";



    await sendInvoiceEmail(
      invoice.client.email,
      clientName,
      currentUser.firstName,
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