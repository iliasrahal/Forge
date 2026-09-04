import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import {
  buildInvoiceDescriptionSections,
  parseInvoiceDescriptionSections,
} from "@/src/lib/invoiceDescription";
import { prisma } from "@/src/lib/prisma";
import {
  computeDocumentTotals,
  formatVatRateBp,
  VAT_EXEMPTION_MENTION,
} from "@/src/lib/vat";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type PdfRouteProps = {
  params: Promise<{ id: string }>;
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
    .replaceAll("€", "EUR")
    .replace(/[^\x00-\xFF]/g, "")
    .trim();
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const paragraphs = cleanPdfText(text).split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;

      if (
        font.widthOfTextAtSize(candidate, size) <= maxWidth
      ) {
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
    const workspaceContext = await requireWorkspaceContext("read");
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: workspaceContext.workspace.id,
      },
      include: {
        client: true,
        intervention: true,
        quote: true,
        lines: true,
      },
    });

    if (!invoice) {
      return new Response("Facture introuvable", {
        status: 404,
      });
    }

    const clientName =
      invoice.client.type === "PARTICULIER"
        ? `${invoice.client.firstName ?? ""} ${
            invoice.client.lastName ?? ""
          }`.trim()
        : invoice.client.companyName?.trim() ?? "";

    const clientAddress = [
      invoice.client.street,
      [
        invoice.client.postalCode,
        invoice.client.city,
      ]
        .filter(Boolean)
        .join(" "),
    ].filter((value): value is string => Boolean(value?.trim()));

    const usefulServiceDetails = invoice.intervention
      ? buildInvoiceDescriptionSections(
          invoice.intervention,
        )
      : parseInvoiceDescriptionSections(
          invoice.description,
        );

    const pdfDocument = await PDFDocument.create();
    const regularFont = await pdfDocument.embedFont(
      StandardFonts.Helvetica,
    );
    const boldFont = await pdfDocument.embedFont(
      StandardFonts.HelveticaBold,
    );

    const pageSize: [number, number] = [595.28, 841.89];
    const margin = 48;
    const contentWidth = pageSize[0] - margin * 2;
    const blue = rgb(0.12, 0.32, 0.68);
    const dark = rgb(0.12, 0.15, 0.2);
    const grey = rgb(0.38, 0.42, 0.48);
    const lightGrey = rgb(0.965, 0.97, 0.975);
    const borderGrey = rgb(0.82, 0.84, 0.87);

    let page: PDFPage =
      pdfDocument.addPage(pageSize);
    let currentY = pageSize[1] - margin;

    const addPage = () => {
      page = pdfDocument.addPage(pageSize);
      currentY = pageSize[1] - margin;
    };

    const ensureSpace = (height: number) => {
      if (currentY - height < 70) {
        addPage();
      }
    };

    const drawLines = (
      lines: string[],
      options: {
        x: number;
        size?: number;
        lineHeight?: number;
        font?: PDFFont;
        color?: ReturnType<typeof rgb>;
      },
    ) => {
      const size = options.size ?? 10;
      const lineHeight = options.lineHeight ?? 15;
      const font = options.font ?? regularFont;
      const color = options.color ?? dark;

      for (const line of lines) {
        ensureSpace(lineHeight);
        page.drawText(cleanPdfText(line), {
          x: options.x,
          y: currentY,
          size,
          font,
          color,
        });
        currentY -= lineHeight;
      }
    };

    const drawSectionTitle = (title: string) => {
      ensureSpace(34);
      page.drawText(title.toUpperCase(), {
        x: margin,
        y: currentY,
        size: 10,
        font: boldFont,
        color: blue,
      });
      currentY -= 9;
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: margin + contentWidth, y: currentY },
        thickness: 0.8,
        color: borderGrey,
      });
      currentY -= 22;
    };

    page.drawText("FORGE", {
      x: margin,
      y: currentY,
      size: 24,
      font: boldFont,
      color: blue,
    });

    const rightEdge = pageSize[0] - margin;
    const invoiceLabel =
      invoice.type === "DEPOSIT" ? "FACTURE D'ACOMPTE" : "FACTURE";
    const invoiceLabelWidth = boldFont.widthOfTextAtSize(
      invoiceLabel,
      18,
    );
    page.drawText(invoiceLabel, {
      x: rightEdge - invoiceLabelWidth,
      y: currentY + 2,
      size: 18,
      font: boldFont,
      color: dark,
    });

    const referenceLines = wrapText(
      invoice.reference,
      regularFont,
      10,
      220,
    );
    let referenceY = currentY - 18;

    for (const line of referenceLines) {
      const lineWidth = regularFont.widthOfTextAtSize(
        line,
        10,
      );
      page.drawText(line, {
        x: rightEdge - lineWidth,
        y: referenceY,
        size: 10,
        font: regularFont,
        color: grey,
      });
      referenceY -= 13;
    }

    currentY -= 56;
    page.drawText(`Créée le ${formatDate(invoice.createdAt)}`, {
      x: margin,
      y: currentY,
      size: 9,
      font: regularFont,
      color: grey,
    });

    if (invoice.type === "DEPOSIT" && invoice.quote) {
      currentY -= 16;
      page.drawText(
        cleanPdfText(`Acompte relatif au devis ${invoice.quote.reference}`),
        {
          x: margin,
          y: currentY,
          size: 10,
          font: boldFont,
          color: blue,
        },
      );
    }

    currentY -= 48;
    drawSectionTitle("Client");

    if (clientName) {
      drawLines([clientName], {
        x: margin,
        size: 13,
        lineHeight: 20,
        font: boldFont,
      });
    }

    drawLines(clientAddress, {
      x: margin,
      size: 10,
    });

    if (invoice.client.email) {
      drawLines([invoice.client.email], {
        x: margin,
        size: 10,
      });
    }

    if (invoice.client.phone) {
      drawLines([invoice.client.phone], {
        x: margin,
        size: 10,
      });
    }

    currentY -= 24;
    drawSectionTitle("Prestation");

    const serviceTitle =
      invoice.intervention?.title?.trim() ||
      invoice.title.trim();
    drawLines(
      wrapText(
        serviceTitle,
        boldFont,
        14,
        contentWidth,
      ),
      {
        x: margin,
        size: 14,
        lineHeight: 20,
        font: boldFont,
      },
    );

    for (const detail of usefulServiceDetails) {
      currentY -= 8;
      drawLines([detail.label], {
        x: margin,
        size: 10,
        lineHeight: 15,
        font: boldFont,
        color: blue,
      });
      currentY -= 2;
      drawLines(
        wrapText(
          detail.content,
          regularFont,
          10,
          contentWidth,
        ),
        {
          x: margin,
          size: 10,
          lineHeight: 15,
        },
      );
    }

    currentY -= 30;
    ensureSpace(94);
    drawSectionTitle("Montant");

    const amountBoxHeight = 56;
    page.drawRectangle({
      x: margin,
      y: currentY - amountBoxHeight + 12,
      width: contentWidth,
      height: amountBoxHeight,
      color: lightGrey,
      borderColor: borderGrey,
      borderWidth: 0.7,
    });
    page.drawText("Total TTC", {
      x: margin + 16,
      y: currentY - 10,
      size: 10,
      font: boldFont,
      color: dark,
    });

    const total = cleanPdfText(
      formatAmount(invoice.amountCents),
    );
    const totalWidth = boldFont.widthOfTextAtSize(
      total,
      18,
    );
    page.drawText(total, {
      x: rightEdge - totalWidth - 16,
      y: currentY - 14,
      size: 18,
      font: boldFont,
      color: dark,
    });
    currentY -= amountBoxHeight + 12;

    if (invoice.vatApplicable) {
      const vt = computeDocumentTotals(
        invoice.lines.map((line) => ({
          amountCents: line.amountCents,
          vatRateBp: line.vatRateBp,
        })),
        true,
        invoice.discountBp,
      );
      const vatRows = [
        `Total HT : ${cleanPdfText(formatAmount(vt.totalHtCents || invoice.totalHtCents))}`,
        ...vt.byRate.map(
          (entry) =>
            `TVA ${formatVatRateBp(entry.rateBp)} : ${cleanPdfText(formatAmount(entry.vatCents))}`,
        ),
        `Total TVA : ${cleanPdfText(formatAmount(vt.totalVatCents || invoice.totalVatCents))}`,
      ];
      if (invoice.discountBp > 0) {
        vatRows.push(
          `Remise globale de ${(invoice.discountBp / 100).toLocaleString("fr-FR")} %`,
        );
      }
      ensureSpace(18 + vatRows.length * 13);
      drawLines(vatRows, {
        x: margin,
        size: 9,
        lineHeight: 13,
        color: grey,
      });
      currentY -= 14;
    } else {
      ensureSpace(20);
      drawLines([cleanPdfText(VAT_EXEMPTION_MENTION)], {
        x: margin,
        size: 8,
        lineHeight: 12,
        color: grey,
      });
      currentY -= 12;
    }

    const artisanDetails = [
      workspaceContext.user.firstName?.trim(),
      workspaceContext.user.email?.trim(),
      workspaceContext.user.phone?.trim(),
    ].filter((value): value is string => Boolean(value));

    if (artisanDetails.length > 0) {
      ensureSpace(54);
      drawSectionTitle("Artisan");
      drawLines(artisanDetails, {
        x: margin,
        size: 9,
        lineHeight: 13,
        color: grey,
      });
    }

    const pages = pdfDocument.getPages();
    pages.forEach((pdfPage, index) => {
      const footerY = 32;
      pdfPage.drawLine({
        start: { x: margin, y: footerY + 14 },
        end: {
          x: pageSize[0] - margin,
          y: footerY + 14,
        },
        thickness: 0.6,
        color: borderGrey,
      });
      pdfPage.drawText(
        cleanPdfText(
          `${invoice.type === "DEPOSIT" ? "Facture d'acompte" : "Facture"} ${invoice.reference}`,
        ),
        {
          x: margin,
          y: footerY,
          size: 8,
          font: regularFont,
          color: grey,
        },
      );

      const pageText = `Page ${index + 1} / ${pages.length}`;
      const pageTextWidth = regularFont.widthOfTextAtSize(
        pageText,
        8,
      );
      pdfPage.drawText(pageText, {
        x: pageSize[0] - margin - pageTextWidth,
        y: footerY,
        size: 8,
        font: regularFont,
        color: grey,
      });
    });

    const pdfBytes = await pdfDocument.save();

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="facture-${invoice.reference}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return Response.json(accessError.body, { status: accessError.status });
    console.error("ERREUR PDF FACTURE :", error);

    return new Response(
      "Erreur génération PDF facture",
      { status: 500 },
    );
  }
}
