import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import { prisma } from "@/src/lib/prisma";

type PdfRouteProps = {
  params: Promise<{ quoteId: string }>;
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

function cleanPdfText(value: string) {
  return (value ?? "")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("\u00A0", " ")
    .replaceAll("\u202F", " ")
    .replaceAll("€", "EUR")
    .replace(/[^\x00-\xFF]/g, "")
    .trim();
}

function usefulText(value?: string | null) {
  const cleaned = cleanPdfText(value ?? "");

  if (
    !cleaned ||
    /^(non (précisé|renseigné)|aucune? description renseignée)\.?$/i.test(
      cleaned,
    )
  ) {
    return "";
  }

  return cleaned;
}

function wrapText(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const lines: string[] = [];

  for (const paragraph of cleanPdfText(value).split(/\n+/)) {
    let line = "";

    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        if (line) {
          lines.push(line);
          line = "";
        }

        let fragment = "";
        for (const character of word) {
          const candidateFragment =
            `${fragment}${character}`;

          if (
            font.widthOfTextAtSize(
              candidateFragment,
              size,
            ) > maxWidth &&
            fragment
          ) {
            lines.push(fragment);
            fragment = character;
          } else {
            fragment = candidateFragment;
          }
        }

        line = fragment;
        continue;
      }

      const candidate = line ? `${line} ${word}` : word;

      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) {
          lines.push(line);
        }
        line = word;
      }
    }

    if (line) {
      lines.push(line);
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
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        lines: true,
      },
    });

    if (!quote) {
      return new Response("Devis introuvable.", {
        status: 404,
      });
    }

    const clientName =
      quote.client.type === "PARTICULIER"
        ? usefulText(
            `${quote.client.firstName ?? ""} ${
              quote.client.lastName ?? ""
            }`,
          )
        : usefulText(quote.client.companyName);
    const clientDetails = [
      clientName,
      usefulText(quote.client.street),
      usefulText(
        [quote.client.postalCode, quote.client.city]
          .filter(Boolean)
          .join(" "),
      ),
      usefulText(quote.client.phone),
      usefulText(quote.client.email),
    ].filter(Boolean);

    const pdfDocument = await PDFDocument.create();
    const regularFont = await pdfDocument.embedFont(
      StandardFonts.Helvetica,
    );
    const boldFont = await pdfDocument.embedFont(
      StandardFonts.HelveticaBold,
    );

    const pageSize: [number, number] = [595.28, 841.89];
    const margin = 48;
    const width = pageSize[0] - margin * 2;
    const rightEdge = pageSize[0] - margin;
    const blue = rgb(0.12, 0.32, 0.68);
    const dark = rgb(0.12, 0.15, 0.2);
    const grey = rgb(0.38, 0.42, 0.48);
    const border = rgb(0.82, 0.84, 0.87);
    const light = rgb(0.965, 0.97, 0.975);

    let page: PDFPage = pdfDocument.addPage(pageSize);
    let y = pageSize[1] - margin;

    const addPage = () => {
      page = pdfDocument.addPage(pageSize);
      y = pageSize[1] - margin;
    };
    const ensure = (height: number) => {
      if (y - height < 70) {
        addPage();
      }
    };
    const drawLines = (
      lines: string[],
      options: {
        x?: number;
        size?: number;
        height?: number;
        font?: PDFFont;
        color?: ReturnType<typeof rgb>;
      } = {},
    ) => {
      const size = options.size ?? 10;
      const height = options.height ?? 15;

      for (const line of lines) {
        ensure(height);
        page.drawText(line, {
          x: options.x ?? margin,
          y,
          size,
          font: options.font ?? regularFont,
          color: options.color ?? dark,
        });
        y -= height;
      }
    };
    const section = (title: string) => {
      ensure(34);
      page.drawText(title.toUpperCase(), {
        x: margin,
        y,
        size: 10,
        font: boldFont,
        color: blue,
      });
      y -= 9;
      page.drawLine({
        start: { x: margin, y },
        end: { x: rightEdge, y },
        thickness: 0.8,
        color: border,
      });
      y -= 22;
    };

    page.drawText("FORGE", {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: blue,
    });
    const heading = "DEVIS";
    const headingWidth = boldFont.widthOfTextAtSize(heading, 18);
    page.drawText(heading, {
      x: rightEdge - headingWidth,
      y: y + 2,
      size: 18,
      font: boldFont,
      color: dark,
    });

    let referenceY = y - 18;
    for (const line of wrapText(
      quote.reference,
      regularFont,
      10,
      220,
    )) {
      const lineWidth = regularFont.widthOfTextAtSize(line, 10);
      page.drawText(line, {
        x: rightEdge - lineWidth,
        y: referenceY,
        size: 10,
        font: regularFont,
        color: grey,
      });
      referenceY -= 13;
    }

    y -= 56;
    page.drawText(`Créé le ${formatDate(quote.createdAt)}`, {
      x: margin,
      y,
      size: 9,
      font: regularFont,
      color: grey,
    });

    y -= 48;
    section("Client");
    if (clientDetails.length > 0) {
      drawLines(clientDetails.flatMap((detail) =>
        wrapText(
          detail,
          regularFont,
          10,
          width,
        ),
      ), {
        size: 10,
        height: 16,
      });
    }

    y -= 24;
    section("Description des travaux");
    const title = usefulText(quote.title);
    if (title) {
      drawLines(
        wrapText(title, boldFont, 14, width),
        {
          size: 14,
          height: 20,
          font: boldFont,
        },
      );
    }
    const description = usefulText(quote.description);
    if (description) {
      y -= 6;
      drawLines(
        wrapText(description, regularFont, 10, width),
      );
    }

    y -= 26;
    section("Tarification");

    const designationWidth = width - 130;
    const amountWidth = 130;
    const drawTableHeader = () => {
      page.drawRectangle({
        x: margin,
        y: y - 22,
        width,
        height: 28,
        color: light,
        borderColor: border,
        borderWidth: 0.7,
      });
      page.drawText("Désignation", {
        x: margin + 10,
        y: y - 11,
        size: 9,
        font: boldFont,
        color: dark,
      });
      const totalLabel = "Total";
      const totalLabelWidth = boldFont.widthOfTextAtSize(
        totalLabel,
        9,
      );
      page.drawText(totalLabel, {
        x: rightEdge - 10 - totalLabelWidth,
        y: y - 11,
        size: 9,
        font: boldFont,
        color: dark,
      });
      y -= 28;
    };

    drawTableHeader();

    const pricedLines = quote.lines.filter(
      (line) =>
        usefulText(line.label) ||
        usefulText(line.category),
    );

    for (const quoteLine of pricedLines) {
      const designation =
        usefulText(quoteLine.label) ||
        usefulText(quoteLine.category);
      const designationLines = wrapText(
        designation,
        regularFont,
        9,
        designationWidth - 20,
      );
      const rowHeight = Math.max(
        32,
        designationLines.length * 13 + 14,
      );

      if (y - rowHeight < 70) {
        addPage();
        drawTableHeader();
      }

      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width,
        height: rowHeight,
        borderColor: border,
        borderWidth: 0.6,
      });
      page.drawLine({
        start: {
          x: margin + designationWidth,
          y,
        },
        end: {
          x: margin + designationWidth,
          y: y - rowHeight,
        },
        thickness: 0.6,
        color: border,
      });

      let lineY = y - 18;
      for (const line of designationLines) {
        page.drawText(line, {
          x: margin + 10,
          y: lineY,
          size: 9,
          font: regularFont,
          color: dark,
        });
        lineY -= 13;
      }

      const amount = cleanPdfText(
        formatAmount(quoteLine.amountCents),
      );
      const renderedAmountWidth =
        regularFont.widthOfTextAtSize(amount, 9);
      page.drawText(amount, {
        x: rightEdge - 10 - renderedAmountWidth,
        y: y - 18,
        size: 9,
        font: regularFont,
        color: dark,
      });
      y -= rowHeight;
    }

    ensure(100);
    y -= 14;
    const total = cleanPdfText(formatAmount(quote.amountCents));
    const summaryX = margin + designationWidth;
    const drawSummary = (
      label: string,
      value: string,
      emphasized = false,
    ) => {
      const rowHeight = emphasized ? 34 : 26;
      page.drawRectangle({
        x: summaryX,
        y: y - rowHeight,
        width: amountWidth,
        height: rowHeight,
        color: emphasized ? light : undefined,
        borderColor: border,
        borderWidth: 0.6,
      });
      page.drawText(label, {
        x: summaryX + 8,
        y: y - (emphasized ? 21 : 17),
        size: emphasized ? 10 : 8,
        font: emphasized ? boldFont : regularFont,
        color: dark,
      });
      const valueWidth = boldFont.widthOfTextAtSize(
        value,
        emphasized ? 11 : 9,
      );
      page.drawText(value, {
        x: rightEdge - 8 - valueWidth,
        y: y - (emphasized ? 21 : 17),
        size: emphasized ? 11 : 9,
        font: boldFont,
        color: dark,
      });
      y -= rowHeight;
    };
    drawSummary("Sous-total", total);
    drawSummary("Total TTC", total, true);

    y -= 34;
    ensure(92);
    section("Bon pour accord");
    drawLines(
      [
        "Date :",
        "Signature du client précédée de la mention « Bon pour accord » :",
      ].map(cleanPdfText),
      { size: 9, height: 22, color: grey },
    );
    y -= 28;
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + 220, y },
      thickness: 0.6,
      color: border,
    });

    const artisanDetails = [
      usefulText(quote.client.user.firstName),
      usefulText(quote.client.user.email),
      usefulText(quote.client.user.phone),
    ].filter(Boolean);
    if (artisanDetails.length > 0) {
      y -= 34;
      ensure(65);
      section("Artisan");
      drawLines(artisanDetails.flatMap((detail) =>
        wrapText(
          detail,
          regularFont,
          9,
          width,
        ),
      ), {
        size: 9,
        height: 13,
        color: grey,
      });
    }

    const pages = pdfDocument.getPages();
    pages.forEach((pdfPage, index) => {
      const footerY = 32;
      pdfPage.drawLine({
        start: { x: margin, y: footerY + 14 },
        end: { x: rightEdge, y: footerY + 14 },
        thickness: 0.6,
        color: border,
      });
      pdfPage.drawText(
        cleanPdfText(`Devis ${quote.reference}`),
        {
          x: margin,
          y: footerY,
          size: Math.min(
            8,
            (300 /
              regularFont.widthOfTextAtSize(
                cleanPdfText(
                  `Devis ${quote.reference}`,
                ),
                8,
              )) *
              8,
          ),
          font: regularFont,
          color: grey,
        },
      );
      const pageLabel = `Page ${index + 1} / ${pages.length}`;
      const pageLabelWidth =
        regularFont.widthOfTextAtSize(pageLabel, 8);
      pdfPage.drawText(pageLabel, {
        x: rightEdge - pageLabelWidth,
        y: footerY,
        size: 8,
        font: regularFont,
        color: grey,
      });
    });

    const pdfBytes = await pdfDocument.save();

    // Comportement historique conservé : le téléchargement
    // marque un brouillon comme envoyé.
    if (quote.status === "BROUILLON") {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: "ENVOYE" },
      });
    }

    const safeReference = quote.reference.replace(
      /[^a-zA-Z0-9-_]/g,
      "-",
    );

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="devis-${safeReference}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ERREUR GENERATION PDF :", error);

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
          "Content-Type": "application/json",
        },
      },
    );
  }
}
