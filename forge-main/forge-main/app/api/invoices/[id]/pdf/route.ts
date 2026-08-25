import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import { prisma } from "@/src/lib/prisma";


type PdfRouteProps = {
  params: Promise<{
    id: string;
  }>;
};



function formatDate(date: Date) {

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);

}



function formatAmount(amountCents: number) {

  return new Intl.NumberFormat(
    "fr-FR",
    {
      style: "currency",
      currency: "EUR",
    },
  ).format(amountCents / 100);

}



function cleanPdfText(text: string) {

  return (text ?? "")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("\u00A0", " ")
    .replace(/[^\x00-\xFF]/g, "");

}



export async function GET(
  request: Request,
  {
    params,
  }: PdfRouteProps,
) {


  try {


    const {
      id,
    } = await params;



    const invoice =
      await prisma.invoice.findUnique({

        where: {
          id,
        },

        include: {
          client: true,
        },

      });



    if (!invoice) {

      return new Response(
        "Facture introuvable",
        {
          status: 404,
        },
      );

    }



    const clientName =
      invoice.client.type === "PARTICULIER"

        ? `${invoice.client.firstName ?? ""} ${
            invoice.client.lastName ?? ""
          }`.trim() || "Client particulier"

        : invoice.client.companyName ??
          "Client professionnel";




    const pdfDocument =
      await PDFDocument.create();



    const regularFont =
      await pdfDocument.embedFont(
        StandardFonts.Helvetica,
      );



    const boldFont =
      await pdfDocument.embedFont(
        StandardFonts.HelveticaBold,
      );



    const page =
      pdfDocument.addPage([
        595.28,
        841.89,
      ]);



    const margin = 50;

    let currentY = 790;



    const pageWidth =
      page.getWidth();



    const blue =
      rgb(
        0.15,
        0.39,
        0.92,
      );


    const dark =
      rgb(
        0.12,
        0.16,
        0.23,
      );



    const grey =
      rgb(
        0.38,
        0.43,
        0.5,
      );



    page.drawText(
      "FORGE",
      {
        x: margin,
        y: currentY,
        size: 22,
        font: boldFont,
        color: blue,
      },
    );



    const invoiceText =
      `FACTURE N° ${invoice.reference}`;



    page.drawText(
      cleanPdfText(invoiceText),
      {
        x: pageWidth - margin - 180,
        y: currentY,
        size: 15,
        font: boldFont,
        color: dark,
      },
    );



    currentY -= 50;



    page.drawText(
      `Créée le ${formatDate(invoice.createdAt)}`,
      {
        x: margin,
        y: currentY,
        size: 10,
        font: regularFont,
        color: grey,
      },
    );



    currentY -= 70;



    page.drawText(
      "CLIENT",
      {
        x: margin,
        y: currentY,
        size: 11,
        font: boldFont,
        color: blue,
      },
    );



    currentY -= 25;



    page.drawText(
      cleanPdfText(clientName),
      {
        x: margin,
        y: currentY,
        size: 14,
        font: boldFont,
        color: blue,
      },
    );



    currentY -= 25;



    page.drawText(
      cleanPdfText(
        invoice.client.street ?? "",
      ),
      {
        x: margin,
        y: currentY,
        size: 10,
        font: regularFont,
        color: dark,
      },
    );



    currentY -= 18;



    page.drawText(
      cleanPdfText(
        `${invoice.client.postalCode ?? ""} ${
          invoice.client.city ?? ""
        }`,
      ),
      {
        x: margin,
        y: currentY,
        size: 10,
        font: regularFont,
        color: dark,
      },
    );



    currentY -= 50;



    page.drawText(
      cleanPdfText(invoice.title),
      {
        x: margin,
        y: currentY,
        size: 18,
        font: boldFont,
        color: blue,
      },
    );



    currentY -= 35;



    page.drawText(
      "DESCRIPTION",
      {
        x: margin,
        y: currentY,
        size: 11,
        font: boldFont,
        color: blue,
      },
    );



    currentY -= 25;



    page.drawText(
      cleanPdfText(
        invoice.description ??
        "Aucune description renseignée.",
      ),
      {
        x: margin,
        y: currentY,
        size: 11,
        font: regularFont,
        color: dark,
      },
    );



    currentY -= 70;



    page.drawRectangle({

      x: margin,

      y: currentY - 50,

      width: pageWidth - margin * 2,

      height: 75,

      color:
        rgb(
          0.94,
          0.97,
          1,
        ),

    });



    page.drawText(
      "MONTANT",
      {
        x: margin + 20,
        y: currentY - 5,
        size: 10,
        font: boldFont,
        color: blue,
      },
    );



    const amount =
      formatAmount(
        invoice.amountCents,
      );



    page.drawText(
      cleanPdfText(amount),
      {
        x: margin + 20,
        y: currentY - 35,
        size: 22,
        font: boldFont,
        color: blue,
      },
    );



    const pdfBytes =
      await pdfDocument.save();



    return new Response(
      Buffer.from(pdfBytes),
      {
        status: 200,

        headers: {

          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="facture-${invoice.reference}.pdf"`,

          "Cache-Control":
            "no-store",

        },

      },
    );



  } catch (error) {


    console.error(
      "ERREUR PDF FACTURE :",
      error,
    );



    return new Response(
      "Erreur génération PDF facture",
      {
        status: 500,
      },
    );

  }

}