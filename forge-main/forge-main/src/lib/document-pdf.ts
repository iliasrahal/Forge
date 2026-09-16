import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

import { formatQuantity, formatUnit } from "@/src/lib/document-lines";
import { embedOrgLogo } from "@/src/lib/pdf-logo";
import { DrawnSignature } from "@/src/lib/quote-signature";

export type PdfDocumentLine = {
  category?: string | null;
  label?: string | null;
  quantityMilli?: number | null;
  unit?: string | null;
  unitPriceCents?: number | null;
  discountBp?: number | null;
  amountCents: number;
  vatRateBp?: number | null;
  materialName?: string | null;
  materialBrand?: string | null;
  materialReference?: string | null;
  materialSpecifications?: unknown;
  details?: Array<{
    label: string;
    description?: string | null;
    amountCents?: number | null;
  }>;
};

export type PdfSummaryRow = {
  label: string;
  value: string;
  emphasized?: boolean;
};

export type PdfSignature = {
  title: string;
  lines: string[];
  drawing?: DrawnSignature | null;
};

export type BusinessDocumentPdfInput = {
  kindLabel: string;
  reference: string;
  logoDataUrl?: string | null;
  issuerLines: string[];
  clientLines: string[];
  metadata: Array<{ label: string; value?: string | null }>;
  title?: string | null;
  lines: PdfDocumentLine[];
  summaryRows: PdfSummaryRow[];
  paymentLines?: string[];
  legalLines?: string[];
  signature?: PdfSignature;
};

const INTERNAL_SPECIFICATION_KEYS = /(?:cost|cout|coût|marge|margin|supplier|fournisseur|purchase|achat|internal|interne)/i;

export function cleanPdfText(value: string) {
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

export function formatPdfAmount(amountCents: number) {
  return cleanPdfText(new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100));
}

export function getClientFacingSpecifications(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([key, item]) =>
      !INTERNAL_SPECIFICATION_KEYS.test(key) &&
      (typeof item === "string" || typeof item === "number" || typeof item === "boolean") &&
      String(item).trim().length > 0,
    )
    .slice(0, 6)
    .map(([key, item]) => `${key}: ${String(item)}`);
}

function categoryLabel(value?: string | null) {
  return cleanPdfText(value?.trim() || "Autre");
}

export function groupDocumentLines(lines: PdfDocumentLine[]) {
  const groups: Array<{ key: string; label: string; lines: PdfDocumentLine[] }> = [];
  const byKey = new Map<string, (typeof groups)[number]>();
  for (const line of lines) {
    const label = categoryLabel(line.category);
    const key = label.toLocaleLowerCase("fr-FR");
    const existing = byKey.get(key);
    if (existing) existing.lines.push(line);
    else {
      const group = { key, label, lines: [line] };
      groups.push(group);
      byKey.set(key, group);
    }
  }
  return groups;
}

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number) {
  const result: string[] = [];
  for (const paragraph of cleanPdfText(value).split(/\n+/)) {
    let current = "";
    for (const rawWord of paragraph.split(/\s+/).filter(Boolean)) {
      const chunks: string[] = [];
      let word = rawWord;
      while (font.widthOfTextAtSize(word, size) > maxWidth && word.length > 1) {
        let cut = 1;
        while (cut < word.length && font.widthOfTextAtSize(word.slice(0, cut + 1), size) <= maxWidth) cut += 1;
        chunks.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      chunks.push(word);
      for (const chunk of chunks) {
        const candidate = current ? `${current} ${chunk}` : chunk;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
        else {
          if (current) result.push(current);
          current = chunk;
        }
      }
    }
    if (current) result.push(current);
  }
  return result;
}

export async function renderBusinessDocumentPdf(input: BusinessDocumentPdfInput) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 42;
  const footerTop = 54;
  const contentWidth = pageSize[0] - margin * 2;
  const right = pageSize[0] - margin;
  const forgeBlue = rgb(0.10, 0.31, 0.66);
  const ink = rgb(0.10, 0.13, 0.18);
  const muted = rgb(0.38, 0.42, 0.48);
  const lineColor = rgb(0.82, 0.85, 0.89);
  const tint = rgb(0.95, 0.97, 0.99);
  let page: PDFPage = pdf.addPage(pageSize);
  let y = pageSize[1] - margin;
  let continuation = true;

  const addPage = () => {
    page = pdf.addPage(pageSize);
    y = pageSize[1] - margin;
    if (continuation) {
      page.drawText(`${cleanPdfText(input.kindLabel)} ${cleanPdfText(input.reference)}`, { x: margin, y, size: 9, font: bold, color: forgeBlue });
      y -= 24;
    }
    continuation = true;
  };
  const ensure = (height: number) => {
    if (y - height < footerTop) addPage();
  };
  const drawWrapped = (value: string, x: number, maxWidth: number, options: { size?: number; lineHeight?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {}) => {
    const size = options.size ?? 9;
    const lineHeight = options.lineHeight ?? 13;
    const lines = wrapText(value, options.font ?? regular, size, maxWidth);
    for (const text of lines) {
      ensure(lineHeight);
      page.drawText(text, { x, y, size, font: options.font ?? regular, color: options.color ?? ink });
      y -= lineHeight;
    }
    return lines.length;
  };

  const logo = await embedOrgLogo(pdf, input.logoDataUrl);
  if (logo) page.drawImage(logo.image, { x: margin, y: y - logo.height + 12, width: logo.width, height: logo.height });
  else page.drawText("FORGE", { x: margin, y, size: 22, font: bold, color: forgeBlue });
  const kind = cleanPdfText(input.kindLabel);
  page.drawText(kind, { x: right - bold.widthOfTextAtSize(kind, 21), y, size: 21, font: bold, color: ink });
  const reference = cleanPdfText(input.reference);
  page.drawText(reference, { x: right - regular.widthOfTextAtSize(reference, 9), y: y - 17, size: 9, font: regular, color: muted });
  y -= 54;
  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 1.2, color: forgeBlue });
  y -= 18;

  const columnGap = 22;
  const columnWidth = (contentWidth - columnGap) / 2;
  const blockTop = y;
  let leftHeight = 0;
  for (const [index, issuerLine] of input.issuerLines.filter(Boolean).entries()) {
    const wrapped = wrapText(issuerLine, index === 0 ? bold : regular, index === 0 ? 10 : 8.5, columnWidth);
    wrapped.forEach((text, lineIndex) => page.drawText(cleanPdfText(text), { x: margin, y: blockTop - leftHeight - lineIndex * 12, size: index === 0 ? 10 : 8.5, font: index === 0 ? bold : regular, color: index === 0 ? ink : muted }));
    leftHeight += wrapped.length * 12;
  }
  let rightHeight = 0;
  if (input.clientLines.length) {
    page.drawText("CLIENT", { x: margin + columnWidth + columnGap, y: blockTop, size: 8, font: bold, color: forgeBlue });
    rightHeight = 15;
    input.clientLines.filter(Boolean).forEach((clientLine, index) => {
      const wrapped = wrapText(clientLine, index === 0 ? bold : regular, index === 0 ? 10 : 8.5, columnWidth);
      wrapped.forEach((text, lineIndex) => page.drawText(cleanPdfText(text), { x: margin + columnWidth + columnGap, y: blockTop - rightHeight - lineIndex * 12, size: index === 0 ? 10 : 8.5, font: index === 0 ? bold : regular, color: index === 0 ? ink : muted }));
      rightHeight += wrapped.length * 12;
    });
  }
  y -= Math.max(leftHeight, rightHeight, 12) + 22;

  const metadata = input.metadata.filter((entry) => entry.value?.trim());
  if (metadata.length || input.title?.trim()) {
    ensure(60);
    page.drawRectangle({ x: margin, y: y - 42, width: contentWidth, height: 50, color: tint, borderColor: lineColor, borderWidth: 0.6 });
    let metaX = margin + 10;
    const metaWidth = Math.min(115, contentWidth / Math.max(metadata.length, 1));
    metadata.forEach((entry) => {
      page.drawText(cleanPdfText(entry.label.toUpperCase()), { x: metaX, y: y - 8, size: 6.5, font: bold, color: muted });
      const value = cleanPdfText(entry.value ?? "");
      page.drawText(value.slice(0, 28), { x: metaX, y: y - 23, size: 8, font: regular, color: ink });
      metaX += metaWidth;
    });
    y -= 54;
    if (input.title?.trim()) {
      drawWrapped(input.title, margin, contentWidth, { size: 13, lineHeight: 17, font: bold });
      y -= 8;
    }
  }

  const widths = [237, 34, 42, 68, 48, contentWidth - 429];
  const starts = widths.map((_, index) => margin + widths.slice(0, index).reduce((sum, width) => sum + width, 0));
  const tableHeader = () => {
    ensure(26);
    page.drawRectangle({ x: margin, y: y - 21, width: contentWidth, height: 25, color: tint, borderColor: lineColor, borderWidth: 0.6 });
    ["DÉSIGNATION", "QTÉ", "UNITÉ", "PU HT", "TVA", "TOTAL HT"].forEach((label, index) => {
      page.drawText(label, { x: starts[index] + 4, y: y - 12, size: index === 0 ? 7 : 6.2, font: bold, color: ink });
    });
    y -= 25;
  };
  tableHeader();

  for (const group of groupDocumentLines(input.lines)) {
    ensure(25);
    page.drawRectangle({ x: margin, y: y - 18, width: contentWidth, height: 20, color: rgb(0.985, 0.99, 1) });
    page.drawText(group.label.toUpperCase(), { x: margin + 6, y: y - 11, size: 7.5, font: bold, color: forgeBlue });
    y -= 20;
    for (const line of group.lines) {
      const materialTitle = [line.materialBrand, line.materialName].filter(Boolean).join(" ").trim();
      const designation = cleanPdfText(materialTitle || line.label || line.category || "Ligne");
      const secondary: string[] = [];
      if (line.materialReference) secondary.push(`Réf. fabricant : ${line.materialReference}`);
      secondary.push(...getClientFacingSpecifications(line.materialSpecifications));
      if ((line.discountBp ?? 0) > 0) secondary.push(`Remise de ligne : ${((line.discountBp ?? 0) / 100).toLocaleString("fr-FR")} %`);
      for (const detail of line.details ?? []) {
        secondary.push(`${detail.label}${detail.description ? ` - ${detail.description}` : ""}${detail.amountCents != null ? ` (${formatPdfAmount(detail.amountCents)})` : ""}`);
      }
      const designationLines = wrapText(designation, bold, 8.2, widths[0] - 10);
      const secondaryLines = secondary.flatMap((text) => wrapText(text, regular, 7, widths[0] - 14));
      const rowHeight = Math.max(31, 12 + designationLines.length * 10 + secondaryLines.length * 9);
      if (y - rowHeight < footerTop) {
        addPage();
        tableHeader();
        page.drawRectangle({ x: margin, y: y - 18, width: contentWidth, height: 20, color: rgb(0.985, 0.99, 1) });
        page.drawText(`${group.label.toUpperCase()} (SUITE)`, { x: margin + 6, y: y - 11, size: 7.5, font: bold, color: forgeBlue });
        y -= 20;
      }
      page.drawRectangle({ x: margin, y: y - rowHeight, width: contentWidth, height: rowHeight, borderColor: lineColor, borderWidth: 0.45 });
      let textY = y - 13;
      designationLines.forEach((text) => { page.drawText(text, { x: starts[0] + 5, y: textY, size: 8.2, font: bold, color: ink }); textY -= 10; });
      secondaryLines.forEach((text) => { page.drawText(text, { x: starts[0] + 8, y: textY, size: 7, font: regular, color: muted }); textY -= 9; });
      const cells = [
        line.quantityMilli == null ? "-" : formatQuantity(line.quantityMilli),
        line.unit ? formatUnit(line.unit) : "-",
        line.unitPriceCents == null ? "-" : formatPdfAmount(line.unitPriceCents),
        line.vatRateBp == null ? "-" : `${(line.vatRateBp / 100).toLocaleString("fr-FR")} %`,
        formatPdfAmount(line.amountCents),
      ];
      cells.forEach((text, cellIndex) => page.drawText(cleanPdfText(text), { x: starts[cellIndex + 1] + 4, y: y - 15, size: cellIndex >= 2 ? 6.8 : 7.2, font: regular, color: ink }));
      y -= rowHeight;
    }
  }

  ensure(35 + input.summaryRows.length * 24);
  y -= 14;
  const summaryX = margin + 285;
  const summaryWidth = right - summaryX;
  for (const row of input.summaryRows) {
    const height = row.emphasized ? 31 : 22;
    page.drawRectangle({ x: summaryX, y: y - height, width: summaryWidth, height, color: row.emphasized ? tint : undefined, borderColor: lineColor, borderWidth: 0.6 });
    page.drawText(cleanPdfText(row.label), { x: summaryX + 8, y: y - (row.emphasized ? 20 : 15), size: row.emphasized ? 9.5 : 8, font: row.emphasized ? bold : regular, color: ink });
    const value = cleanPdfText(row.value);
    const font = row.emphasized ? bold : regular;
    const size = row.emphasized ? 11 : 8;
    page.drawText(value, { x: right - 8 - font.widthOfTextAtSize(value, size), y: y - (row.emphasized ? 20 : 15), size, font, color: row.emphasized ? forgeBlue : ink });
    y -= height;
  }

  const infoLines = [...(input.paymentLines ?? []), ...(input.legalLines ?? [])].filter(Boolean);
  if (infoLines.length) {
    y -= 14;
    for (const info of infoLines) drawWrapped(info, margin, contentWidth, { size: 7.5, lineHeight: 11, color: muted });
  }

  if (input.signature) {
    ensure(input.signature.drawing ? 135 : 90);
    y -= 18;
    page.drawText(cleanPdfText(input.signature.title.toUpperCase()), { x: margin, y, size: 8, font: bold, color: forgeBlue });
    y -= 17;
    for (const signatureLine of input.signature.lines) drawWrapped(signatureLine, margin, contentWidth, { size: 8, lineHeight: 12, color: muted });
    if (input.signature.drawing) {
      const box = { x: margin, y: y - 68, width: 220, height: 62 };
      page.drawRectangle({ ...box, color: tint, borderColor: lineColor, borderWidth: 0.6 });
      input.signature.drawing.strokes.forEach((stroke) => stroke.slice(1).forEach((to, index) => {
        const from = stroke[index];
        page.drawLine({ start: { x: box.x + from[0] * box.width, y: box.y + (1 - from[1]) * box.height }, end: { x: box.x + to[0] * box.width, y: box.y + (1 - to[1]) * box.height }, thickness: 1.2, color: ink });
      }));
      y -= 76;
    }
  }

  const pages = pdf.getPages();
  pages.forEach((pdfPage, index) => {
    pdfPage.drawLine({ start: { x: margin, y: 42 }, end: { x: right, y: 42 }, thickness: 0.5, color: lineColor });
    const left = cleanPdfText(`${input.kindLabel} ${input.reference}`);
    pdfPage.drawText(left, { x: margin, y: 28, size: 7, font: regular, color: muted });
    const pageLabel = `Page ${index + 1} / ${pages.length}`;
    pdfPage.drawText(pageLabel, { x: right - regular.widthOfTextAtSize(pageLabel, 7), y: 28, size: 7, font: regular, color: muted });
  });
  return pdf.save();
}
