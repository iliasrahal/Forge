import type { PDFDocument, PDFImage } from "pdf-lib";

import { logoBytesFromDataUrl, logoFormatFromDataUrl } from "@/src/lib/org-branding";

export type EmbeddedLogo = {
  image: PDFImage;
  width: number;
  height: number;
};

/**
 * Embarque le logo de l'organisation dans un PDF et renvoie ses dimensions
 * cibles (hauteur ~36pt, largeur bornée à 170pt). Renvoie `null` si aucun
 * logo ou si l'image est illisible — le rendu retombe alors sur le texte.
 */
export async function embedOrgLogo(
  doc: PDFDocument,
  dataUrl: string | null | undefined,
  options: { targetHeight?: number; maxWidth?: number } = {},
): Promise<EmbeddedLogo | null> {
  if (!dataUrl) return null;
  const format = logoFormatFromDataUrl(dataUrl);
  const bytes = logoBytesFromDataUrl(dataUrl);
  if (!format || !bytes) return null;

  try {
    const image =
      format === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

    const targetHeight = options.targetHeight ?? 36;
    const maxWidth = options.maxWidth ?? 170;
    let height = targetHeight;
    let width = (image.width / image.height) * height;
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
    return { image, width, height };
  } catch {
    return null;
  }
}
