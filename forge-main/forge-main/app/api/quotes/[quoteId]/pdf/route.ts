import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import { prisma } from "@/src/lib/prisma";

type PdfRouteProps = {
  params: Promise<{
    quoteId: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}

function cleanPdfText(text: string) {
  return (text ?? "")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("\u00A0", " ")
    .replaceAll("\u202F", " ")
    .replace(/[^\x00-\xFF]/g, "");
}

function splitTextIntoLines(
  text: string,
  maxWidth: number,
  font: {
    widthOfTextAtSize: (
      text: string,
      size: number,
    ) => number;
  },
  fontSize: number,
) {
  const paragraphs =
    cleanPdfText(text).split("\n");

  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine
        ? `${currentLine} ${word}`
        : word;

      const lineWidth =
        font.widthOfTextAtSize(
          testLine,
          fontSize,
        );

      if (lineWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }

        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

export async function GET(
  request: Request,
  { params }: PdfRouteProps,
) {

  try {

    const { quoteId } = await params;

  const quote =
    await prisma.quote.findUnique({
      where: {
        id: quoteId,
      },
     include: {
  client: true,
  lines: true,
},
    });

  if (!quote) {
    return new Response(
      "Devis introuvable.",
      {
        status: 404,
      },
    );
  }

  const clientName =
    quote.client.type === "PARTICULIER"
      ? `${quote.client.firstName ?? ""} ${
          quote.client.lastName ?? ""
        }`.trim() || "Client particulier"
      : quote.client.companyName ??
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

  const page = pdfDocument.addPage([
    595.28,
    841.89,
  ]);

  const pageWidth = page.getWidth();
  const margin = 50;
  const contentWidth =
    pageWidth - margin * 2;

  let currentY = 790;

  const blue = rgb(0.15, 0.39, 0.92);
  const dark = rgb(0.12, 0.16, 0.23);
  const grey = rgb(0.38, 0.43, 0.5);
  const lightGrey = rgb(
    0.9,
    0.92,
    0.95,
  );

  page.drawText("FORGE", {
    x: margin,
    y: currentY,
    size: 22,
    font: boldFont,
    color: blue,
  });

  const quoteNumberText =
    cleanPdfText(
      `DEVIS N° ${quote.reference}`,
    );

  const quoteNumberWidth =
    boldFont.widthOfTextAtSize(
      quoteNumberText,
      15,
    );

  page.drawText(quoteNumberText, {
    x:
      pageWidth -
      margin -
      quoteNumberWidth,
    y: currentY + 2,
    size: 15,
    font: boldFont,
    color: dark,
  });

  currentY -= 34;

  page.drawLine({
    start: {
      x: margin,
      y: currentY,
    },
    end: {
      x: pageWidth - margin,
      y: currentY,
    },
    thickness: 1,
    color: lightGrey,
  });

  currentY -= 32;

  page.drawText(
    cleanPdfText(
      `Créé le ${formatDate(
        quote.createdAt,
      )}`,
    ),
    {
      x: margin,
      y: currentY,
      size: 10,
      font: regularFont,
      color: grey,
    },
  );

  currentY -= 70;

  page.drawText("CLIENT", {
    x: margin,
    y: currentY,
    size: 11,
    font: boldFont,
    color: blue,
  });

  currentY -= 24;

  page.drawText(
    cleanPdfText(clientName),
    {
      x: margin,
      y: currentY,
      size: 13,
      font: boldFont,
      color: blue,
    },
  );

  currentY -= 20;

  page.drawText(
    cleanPdfText(
      quote.client.street ?? "",
    ),
    {
      x: margin,
      y: currentY,
      size: 10,
      font: regularFont,
      color: dark,
    },
  );

  currentY -= 16;

  page.drawText(
    cleanPdfText(
      `${
        quote.client.postalCode ?? ""
      } ${quote.client.city ?? ""}`.trim(),
    ),
    {
      x: margin,
      y: currentY,
      size: 10,
      font: regularFont,
      color: dark,
    },
  );

  currentY -= 16;

  page.drawText(
    cleanPdfText(
      `Téléphone : ${
        quote.client.phone ??
        "Non renseigné"
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

  if (quote.client.email) {
    currentY -= 16;

    page.drawText(
      cleanPdfText(
        `E-mail : ${quote.client.email}`,
      ),
      {
        x: margin,
        y: currentY,
        size: 10,
        font: regularFont,
        color: dark,
      },
    );
  }

  currentY -= 48;

  page.drawLine({
    start: {
      x: margin,
      y: currentY,
    },
    end: {
      x: pageWidth - margin,
      y: currentY,
    },
    thickness: 1,
    color: lightGrey,
  });

  currentY -= 38;

  page.drawText(
    cleanPdfText(quote.title),
    {
      x: margin,
      y: currentY,
      size: 18,
      font: boldFont,
      color: blue,
    },
  );

  currentY -= 36;

  page.drawText(
    "DESCRIPTION DES TRAVAUX",
    {
      x: margin,
      y: currentY,
      size: 11,
      font: boldFont,
      color: blue,
    },
  );

  currentY -= 24;

  const description =
    quote.description?.trim() ||
    "Aucune description renseignée.";

  const descriptionLines =
    splitTextIntoLines(
      description,
      contentWidth,
      regularFont,
      11,
    );

  for (const line of descriptionLines) {
    if (currentY < 180) {
      break;
    }

    page.drawText(line, {
      x: margin,
      y: currentY,
      size: 11,
      font: regularFont,
      color: dark,
    });

    currentY -= 17;
  }

  currentY -= 30;

  page.drawText(
  "DÉTAIL DU DEVIS",
  {
    x: margin,
    y: currentY,
    size: 11,
    font: boldFont,
    color: blue,
  },
);

currentY -= 24;


for (const line of quote.lines) {

page.drawText(
  cleanPdfText(
    line.label ?? line.category ?? "Prestation",
  ),
  {
    x: margin,
    y: currentY,
    size: 11,
    font: regularFont,
    color: dark,
  },
);


  const lineAmount =
    cleanPdfText(
      formatAmount(
        line.amountCents,
      ),
    );


  page.drawText(
    lineAmount,
    {
      x:
        pageWidth -
        margin -
        80,
      y: currentY,
      size: 11,
      font: regularFont,
      color: dark,
    },
  );


  currentY -= 18;
}


currentY -= 20;
  page.drawRectangle({
    x: margin,
    y: currentY - 55,
    width: contentWidth,
    height: 75,
    color: rgb(0.94, 0.97, 1),
    borderColor: rgb(
      0.75,
      0.85,
      1,
    ),
    borderWidth: 1,
  });

  page.drawText(
    "MONTANT",
    {
      x: margin + 18,
      y: currentY - 2,
      size: 10,
      font: boldFont,
      color: blue,
    },
  );

  const amountText =
    cleanPdfText(
      formatAmount(
        quote.amountCents,
      ),
    );

  const amountWidth =
    boldFont.widthOfTextAtSize(
      amountText,
      22,
    );

  page.drawText(amountText, {
    x:
      pageWidth -
      margin -
      amountWidth -
      18,
    y: currentY - 30,
    size: 22,
    font: boldFont,
    color: blue,
  });

  const pdfBytes =
    await pdfDocument.save();

  /*
   * Après la génération réussie du PDF,
   * le devis passe de BROUILLON à ENVOYE.
   * Un devis déjà accepté ou refusé
   * conserve son statut actuel.
   */
  if (quote.status === "BROUILLON") {
    await prisma.quote.update({
      where: {
        id: quote.id,
      },
      data: {
        status: "ENVOYE",
      },
    });
  }

  const safeReference =
    quote.reference.replace(
      /[^a-zA-Z0-9-_]/g,
      "-",
    );

return new Response(
  Buffer.from(pdfBytes),
  {
    status: 200,
    headers: {
      "Content-Type":
        "application/pdf",
      "Content-Disposition":
        `attachment; filename="devis-${safeReference}.pdf"`,
      "Cache-Control":
        "no-store",
    },
  },
);


  } catch (error) {

    console.error(
      "ERREUR GENERATION PDF :",
      error,
    );


    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue",
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json",
        },
      },
    );

  }
}