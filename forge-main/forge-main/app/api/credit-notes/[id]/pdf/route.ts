import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

import { prisma } from "@/src/lib/prisma";
import {
  computeDocumentTotals,
  formatVatRateBp,
  VAT_EXEMPTION_MENTION,
} from "@/src/lib/vat";
import { displayDocumentReference } from "@/src/lib/document-numbering";
import { embedOrgLogo } from "@/src/lib/pdf-logo";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

type PdfRouteProps = { params: Promise<{ id: string }> };

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
    .replaceAll(" ", " ")
    .replaceAll(" ", " ")
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
  const lines: string[] = [];
  for (const paragraph of cleanPdfText(text).split(/\n+/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export async function GET(request: Request, { params }: PdfRouteProps) {
  try {
    const context = await requireWorkspaceContext("read");
    const { id } = await params;

    const creditNote = await prisma.creditNote.findFirst({
      where: { id, organizationId: context.workspace.id },
      include: {
        lines: { orderBy: { createdAt: "asc" } },
        client: true,
        invoice: { select: { reference: true } },
        organization: { select: { logoDataUrl: true } },
      },
    });

    if (!creditNote) {
      return new Response("Avoir introuvable", { status: 404 });
    }

    const clientName =
      creditNote.client.type === "PARTICULIER"
        ? `${creditNote.client.firstName ?? ""} ${
            creditNote.client.lastName ?? ""
          }`.trim()
        : creditNote.client.companyName?.trim() ?? "";

    const clientAddress = [
      creditNote.client.street,
      [creditNote.client.postalCode, creditNote.client.city]
        .filter(Boolean)
        .join(" "),
    ].filter((value): value is string => Boolean(value?.trim()));

    const totals = computeDocumentTotals(
      creditNote.lines.map((line) => ({
        amountCents: line.amountCents,
        vatRateBp: line.vatRateBp,
      })),
      creditNote.vatApplicable,
      creditNote.discountBp,
    );

    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pageSize: [number, number] = [595.28, 841.89];
    const margin = 48;
    const contentWidth = pageSize[0] - margin * 2;
    const rightEdge = pageSize[0] - margin;
    const blue = rgb(0.12, 0.32, 0.68);
    const dark = rgb(0.12, 0.15, 0.2);
    const grey = rgb(0.38, 0.42, 0.48);
    const lightGrey = rgb(0.965, 0.97, 0.975);
    const border = rgb(0.82, 0.84, 0.87);

    const page = pdf.addPage(pageSize);
    let y = pageSize[1] - margin;

    const drawLines = (
      values: string[],
      options: {
        x?: number;
        size?: number;
        lineHeight?: number;
        font?: PDFFont;
        color?: ReturnType<typeof rgb>;
      } = {},
    ) => {
      const size = options.size ?? 10;
      const lineHeight = options.lineHeight ?? 15;
      for (const value of values) {
        page.drawText(cleanPdfText(value), {
          x: options.x ?? margin,
          y,
          size,
          font: options.font ?? regular,
          color: options.color ?? dark,
        });
        y -= lineHeight;
      }
    };

    const section = (title: string) => {
      page.drawText(title.toUpperCase(), {
        x: margin,
        y,
        size: 10,
        font: bold,
        color: blue,
      });
      y -= 9;
      page.drawLine({
        start: { x: margin, y },
        end: { x: margin + contentWidth, y },
        thickness: 0.8,
        color: border,
      });
      y -= 22;
    };

    const logo = await embedOrgLogo(pdf, creditNote.organization?.logoDataUrl);
    if (logo) {
      page.drawImage(logo.image, {
        x: margin,
        y: y - logo.height + 18,
        width: logo.width,
        height: logo.height,
      });
    } else {
      page.drawText("FORGE", {
        x: margin,
        y,
        size: 24,
        font: bold,
        color: blue,
      });
    }
    const heading = "AVOIR";
    page.drawText(heading, {
      x: rightEdge - bold.widthOfTextAtSize(heading, 18),
      y: y + 2,
      size: 18,
      font: bold,
      color: dark,
    });
    const ref = displayDocumentReference(creditNote.reference);
    page.drawText(ref, {
      x: rightEdge - regular.widthOfTextAtSize(ref, 10),
      y: y - 18,
      size: 10,
      font: regular,
      color: grey,
    });
    const sourceLabel = cleanPdfText(
      `sur facture ${creditNote.invoice.reference}`,
    );
    page.drawText(sourceLabel, {
      x: rightEdge - regular.widthOfTextAtSize(sourceLabel, 9),
      y: y - 31,
      size: 9,
      font: regular,
      color: grey,
    });

    y -= 56;
    page.drawText(`Émis le ${formatDate(creditNote.issuedAt ?? creditNote.createdAt)}`, {
      x: margin,
      y,
      size: 9,
      font: regular,
      color: grey,
    });

    y -= 44;
    section("Client");
    if (clientName) {
      drawLines([clientName], { size: 13, lineHeight: 20, font: bold });
    }
    drawLines(clientAddress);

    y -= 18;
    section("Motif de l'avoir");
    drawLines(
      wrapText(creditNote.reason ?? "-", regular, 10, contentWidth),
    );

    y -= 18;
    section("Lignes créditées");
    for (const line of creditNote.lines) {
      const label = cleanPdfText(line.label || line.category);
      const wrapped = wrapText(label, regular, 9, contentWidth - 130);
      page.drawRectangle({
        x: margin,
        y: y - Math.max(24, wrapped.length * 12 + 12),
        width: contentWidth,
        height: Math.max(24, wrapped.length * 12 + 12),
        borderColor: border,
        borderWidth: 0.6,
      });
      let lineY = y - 15;
      for (const part of wrapped) {
        page.drawText(part, {
          x: margin + 10,
          y: lineY,
          size: 9,
          font: regular,
          color: dark,
        });
        lineY -= 12;
      }
      const amount = cleanPdfText(`- ${formatAmount(line.amountCents)}`);
      page.drawText(amount, {
        x: rightEdge - 10 - regular.widthOfTextAtSize(amount, 9),
        y: y - 15,
        size: 9,
        font: regular,
        color: dark,
      });
      y -= Math.max(24, wrapped.length * 12 + 12);
    }

    y -= 20;
    page.drawRectangle({
      x: margin,
      y: y - 44,
      width: contentWidth,
      height: 50,
      color: lightGrey,
      borderColor: border,
      borderWidth: 0.7,
    });
    page.drawText("Montant de l'avoir (TTC)", {
      x: margin + 16,
      y: y - 8,
      size: 10,
      font: bold,
      color: dark,
    });
    const total = cleanPdfText(`- ${formatAmount(creditNote.amountCents)}`);
    page.drawText(total, {
      x: rightEdge - 16 - bold.widthOfTextAtSize(total, 16),
      y: y - 12,
      size: 16,
      font: bold,
      color: dark,
    });
    y -= 62;

    if (creditNote.vatApplicable) {
      const rows = [
        `Total HT : - ${cleanPdfText(formatAmount(totals.totalHtCents))}`,
        ...totals.byRate.map(
          (entry) =>
            `TVA ${formatVatRateBp(entry.rateBp)} : - ${cleanPdfText(
              formatAmount(entry.vatCents),
            )}`,
        ),
        `Total TVA : - ${cleanPdfText(formatAmount(totals.totalVatCents))}`,
      ];
      drawLines(rows, { size: 9, lineHeight: 13, color: grey });
    } else {
      drawLines([cleanPdfText(VAT_EXEMPTION_MENTION)], {
        size: 8,
        lineHeight: 12,
        color: grey,
      });
    }

    void request;
    const bytes = await pdf.save();
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="avoir-${creditNote.reference}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) {
      return Response.json(accessError.body, { status: accessError.status });
    }
    console.error("ERREUR PDF AVOIR :", error);
    return new Response("Erreur génération PDF avoir", { status: 500 });
  }
}
