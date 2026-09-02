import { createHash } from "node:crypto";

export const MAX_SIGNATURE_STROKES = 60;
export const MAX_SIGNATURE_POINTS = 3_000;
export const MAX_SIGNATURE_JSON_BYTES = 100_000;

export type SignaturePoint = [number, number];

export type DrawnSignature = {
  version: 1;
  strokes: SignaturePoint[][];
};

export type QuoteSignatureSnapshot = {
  version: 1;
  reference: string;
  organizationName: string | null;
  client: {
    type: "PARTICULIER" | "PROFESSIONNEL";
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
    email: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
  };
  title: string;
  description: string | null;
  lines: Array<{
    category: string;
    label: string | null;
    amountCents: number;
  }>;
  amountCents: number;
};

function roundedCoordinate(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

export function validateSignerName(value: unknown, label: string) {
  if (typeof value !== "string") {
    return { value: null, error: `${label} est obligatoire.` };
  }
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return { value: null, error: `${label} est obligatoire.` };
  if (cleaned.length > 100 || /[\u0000-\u001F\u007F]/.test(cleaned)) {
    return { value: null, error: `${label} est invalide.` };
  }
  return { value: cleaned, error: null };
}

export function validateDrawnSignature(value: unknown):
  | { signature: DrawnSignature; error: null }
  | { signature: null; error: string } {
  let serialized = "";
  try {
    serialized = JSON.stringify(value);
  } catch {
    return { signature: null, error: "La signature est invalide." };
  }
  if (!serialized || Buffer.byteLength(serialized, "utf8") > MAX_SIGNATURE_JSON_BYTES) {
    return { signature: null, error: "La signature est trop volumineuse." };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { signature: null, error: "La signature est obligatoire." };
  }
  const candidate = value as { version?: unknown; strokes?: unknown };
  if (candidate.version !== 1 || !Array.isArray(candidate.strokes)) {
    return { signature: null, error: "La signature est invalide." };
  }
  if (candidate.strokes.length < 1) {
    return { signature: null, error: "La signature est obligatoire." };
  }
  if (candidate.strokes.length > MAX_SIGNATURE_STROKES) {
    return { signature: null, error: "La signature est trop volumineuse." };
  }

  let pointCount = 0;
  let pathLength = 0;
  const strokes: SignaturePoint[][] = [];
  for (const stroke of candidate.strokes) {
    if (!Array.isArray(stroke) || stroke.length < 2) {
      return { signature: null, error: "La signature est invalide." };
    }
    const cleanStroke: SignaturePoint[] = [];
    for (const point of stroke) {
      if (
        !Array.isArray(point) ||
        point.length !== 2 ||
        typeof point[0] !== "number" ||
        typeof point[1] !== "number" ||
        !Number.isFinite(point[0]) ||
        !Number.isFinite(point[1]) ||
        point[0] < 0 ||
        point[0] > 1 ||
        point[1] < 0 ||
        point[1] > 1
      ) {
        return { signature: null, error: "La signature est invalide." };
      }
      const cleanPoint: SignaturePoint = [roundedCoordinate(point[0]), roundedCoordinate(point[1])];
      const previous = cleanStroke.at(-1);
      if (previous) pathLength += Math.hypot(cleanPoint[0] - previous[0], cleanPoint[1] - previous[1]);
      cleanStroke.push(cleanPoint);
      pointCount += 1;
      if (pointCount > MAX_SIGNATURE_POINTS) {
        return { signature: null, error: "La signature est trop volumineuse." };
      }
    }
    strokes.push(cleanStroke);
  }
  if (pointCount < 3 || pathLength < 0.04) {
    return { signature: null, error: "La signature est trop courte." };
  }
  return { signature: { version: 1, strokes }, error: null };
}

export function buildQuoteSignatureSnapshot(quote: {
  reference: string;
  title: string;
  description: string | null;
  amountCents: number;
  organization: { name: string } | null;
  client: QuoteSignatureSnapshot["client"];
  lines: Array<{ category: string; label: string | null; amountCents: number }>;
}): QuoteSignatureSnapshot {
  return {
    version: 1,
    reference: quote.reference,
    organizationName: quote.organization?.name ?? null,
    client: { ...quote.client },
    title: quote.title,
    description: quote.description,
    lines: quote.lines.map((line) => ({ ...line })),
    amountCents: quote.amountCents,
  };
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}

export function createQuoteIntegrityHash(input: {
  snapshot: QuoteSignatureSnapshot;
  signerFirstName: string;
  signerLastName: string;
  signedAt: Date;
}) {
  return createHash("sha256")
    .update(canonicalJson({
      quote: input.snapshot,
      signer: { firstName: input.signerFirstName, lastName: input.signerLastName },
      signedAt: input.signedAt.toISOString(),
    }))
    .digest("hex");
}

export function parseQuoteSignatureSnapshot(value: unknown): QuoteSignatureSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshot = value as Partial<QuoteSignatureSnapshot>;
  return snapshot.version === 1 && typeof snapshot.reference === "string" &&
    typeof snapshot.title === "string" && typeof snapshot.amountCents === "number" &&
    !!snapshot.client && Array.isArray(snapshot.lines)
    ? snapshot as QuoteSignatureSnapshot
    : null;
}

export function shortIntegrityReference(hash: string) {
  return hash.length >= 8 ? `${hash.slice(0, 4).toUpperCase()}…${hash.slice(-4).toUpperCase()}` : hash.toUpperCase();
}
