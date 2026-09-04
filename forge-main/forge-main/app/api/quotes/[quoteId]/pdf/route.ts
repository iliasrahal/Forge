import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import { prisma } from "@/src/lib/prisma";
import { parseQuoteSignatureSnapshot, shortIntegrityReference, validateDrawnSignature } from "@/src/lib/quote-signature";
import {
  computeDocumentTotals,
  formatVatRateBp,
  VAT_EXEMPTION_MENTION,
} from "@/src/lib/vat";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
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
    const workspaceContext = await requireWorkspaceContext("read");
    const { quoteId } = await params;
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, organizationId: workspaceContext.workspace.id },
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
        signature: true,
      },
    });

    if (!quote) {
      return new Response("Devis introuvable.", {
        status: 404,
      });
    }

    const signedSnapshot = quote.signature
      ? parseQuoteSignatureSnapshot(quote.signature.quoteSnapshot)
      : null;
    const frozenClient = signedSnapshot?.client ?? quote.client;
    const frozenReference = signedSnapshot?.reference ?? quote.reference;
    const frozenTitle = signedSnapshot?.title ?? quote.title;
    const frozenDescription = signedSnapshot?.description ?? quote.description;
    const frozenAmountCents = signedSnapshot?.amountCents ?? quote.amountCents;
    const frozenLines = signedSnapshot?.lines ?? quote.lines;
    const clientName =
      frozenClient.type === "PARTICULIER"
        ? usefulText(
            `${frozenClient.firstName ?? ""} ${
              frozenClient.lastName ?? ""
            }`,
          )
        : usefulText(frozenClient.companyName);
    const clientDetails = [
      clientName,
      usefulText(frozenClient.street),
      usefulText(
        [frozenClient.postalCode, frozenClient.city]
          .filter(Boolean)
          .join(" "),
      ),
      usefulText(frozenClient.phone),
      usefulText(frozenClient.email),
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
      frozenReference,
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
    const title = usefulText(frozenTitle);
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
    const description = usefulText(frozenDescription);
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

    const pricedLines = frozenLines.filter(
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
    const total = cleanPdfText(formatAmount(frozenAmountCents));
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
    if (quote.vatApplicable) {
      const vt = computeDocumentTotals(
        frozenLines.map((line) => {
          const rate = (line as { vatRateBp?: number }).vatRateBp;
          return {
            amountCents: line.amountCents,
            vatRateBp: typeof rate === "number" ? rate : 0,
          };
        }),
        true,
        quote.discountBp ?? 0,
      );
      drawSummary(
        "Total HT",
        cleanPdfText(formatAmount(vt.totalHtCents || quote.totalHtCents)),
      );
      for (const entry of vt.byRate) {
        drawSummary(
          cleanPdfText(`TVA ${formatVatRateBp(entry.rateBp)}`),
          cleanPdfText(formatAmount(entry.vatCents)),
        );
      }
      drawSummary("Total TTC", total, true);
    } else {
      drawSummary("Sous-total", total);
      drawSummary("Total", total, true);
    }

    y -= 12;
    const pdfMentions: string[] = [];
    if (quote.discountBp && quote.discountBp > 0) {
      pdfMentions.push(
        cleanPdfText(
          `Remise globale de ${(quote.discountBp / 100).toLocaleString("fr-FR")} % appliquee.`,
        ),
      );
    }
    if (!quote.vatApplicable) {
      pdfMentions.push(cleanPdfText(VAT_EXEMPTION_MENTION));
    }
    if (pdfMentions.length > 0) {
      drawLines(pdfMentions, { size: 8, height: 12, color: grey });
    }

    y -= 22;
    if (quote.signature) {
      ensure(190);
      section("Devis accepté et signé");
      drawLines([
        cleanPdfText(`Signataire : ${quote.signature.signerFirstName} ${quote.signature.signerLastName}`),
        cleanPdfText(`Signé le : ${formatDateTime(quote.signature.signedAt)}`),
        cleanPdfText(`Référence de preuve : ${shortIntegrityReference(quote.signature.integrityHash)}`),
      ], { size: 9, height: 16, color: grey });
      y -= 5;
      const signatureBox = { x: margin, y: y - 82, width: 230, height: 76 };
      page.drawRectangle({ ...signatureBox, borderColor: border, borderWidth: 0.7, color: light });
      const parsedSignature = validateDrawnSignature(quote.signature.signatureData);
      if (parsedSignature.signature) {
        for (const stroke of parsedSignature.signature.strokes) {
          for (let index = 1; index < stroke.length; index += 1) {
            const from = stroke[index - 1];
            const to = stroke[index];
            page.drawLine({
              start: { x: signatureBox.x + from[0] * signatureBox.width, y: signatureBox.y + (1 - from[1]) * signatureBox.height },
              end: { x: signatureBox.x + to[0] * signatureBox.width, y: signatureBox.y + (1 - to[1]) * signatureBox.height },
              thickness: 1.35,
              color: dark,
            });
          }
        }
      }
      y -= 94;
    } else {
      ensure(92);
      section("Bon pour accord");
      drawLines(["Date :", "Signature du client précédée de la mention « Bon pour accord » :"].map(cleanPdfText), { size: 9, height: 22, color: grey });
      y -= 28;
      page.drawLine({ start: { x: margin, y }, end: { x: margin + 220, y }, thickness: 0.6, color: border });
    }

    const artisanDetails = [
      usefulText(workspaceContext.user.firstName),
      usefulText(workspaceContext.user.email),
      usefulText(workspaceContext.user.phone),
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
        cleanPdfText(`Devis ${frozenReference}`),
        {
          x: margin,
          y: footerY,
          size: Math.min(
            8,
            (300 /
              regularFont.widthOfTextAtSize(
                cleanPdfText(
                  `Devis ${frozenReference}`,
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

    const safeReference = frozenReference.replace(
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
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return Response.json(accessError.body, { status: accessError.status });
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
