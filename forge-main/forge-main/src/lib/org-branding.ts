/**
 * Logo d'entreprise stocké en data URL (PNG ou JPEG) sur l'organisation.
 * Volontairement borné : un logo doit rester léger, il voyage dans chaque
 * ligne d'organisation et dans chaque génération de PDF.
 */

/** ~500 Ko de binaire une fois encodé en base64. */
export const LOGO_MAX_CHARS = 700_000;

const LOGO_DATA_URL_RE =
  /^data:image\/(png|jpe?g);base64,[A-Za-z0-9+/]+=*$/;

export function isValidLogoDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= LOGO_MAX_CHARS &&
    LOGO_DATA_URL_RE.test(value)
  );
}

export function logoFormatFromDataUrl(
  dataUrl: string,
): "png" | "jpeg" | null {
  const match = dataUrl.match(/^data:image\/(png|jpe?g);base64,/);
  if (!match) return null;
  return match[1].startsWith("png") ? "png" : "jpeg";
}

export function logoBytesFromDataUrl(dataUrl: string): Buffer | null {
  const base64 = dataUrl.split(",", 2)[1];
  if (!base64) return null;
  try {
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}
