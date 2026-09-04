import type { EditableQuoteLine } from "@/src/lib/quote-lines";

export type QuoteCatalogMatchSource = {
  id: string;
  name: string;
  priceCents: number;
};

type PositionedToken = {
  value: string;
  start: number;
  end: number;
};

const ignoredWords = new Set([
  "a",
  "au",
  "aux",
  "avec",
  "d",
  "de",
  "des",
  "du",
  "en",
  "et",
  "l",
  "la",
  "le",
  "les",
  "pour",
  "un",
  "une",
]);

function normalizeToken(value: string) {
  return value
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(value: string): PositionedToken[] {
  return Array.from(value.matchAll(/[\p{L}\p{N}]+/gu), (match) => ({
    value: normalizeToken(match[0]),
    start: match.index,
    end: match.index + match[0].length,
  })).filter((token) => !ignoredWords.has(token.value));
}

function findTokenSequence(
  messageTokens: PositionedToken[],
  serviceTokens: PositionedToken[],
) {
  if (serviceTokens.length === 0) return null;

  for (
    let startIndex = 0;
    startIndex <= messageTokens.length - serviceTokens.length;
    startIndex += 1
  ) {
    const matches = serviceTokens.every(
      (token, offset) =>
        messageTokens[startIndex + offset]?.value === token.value,
    );

    if (matches) {
      return {
        start: messageTokens[startIndex].start,
        end: messageTokens[startIndex + serviceTokens.length - 1].end,
      };
    }
  }

  return null;
}

function getExplicitPriceCents(message: string, matchEnd: number) {
  const immediatelyAfterService = message.slice(matchEnd, matchEnd + 40);
  const match = immediatelyAfterService.match(
    /^\s*(?:(?:à|a|pour)\s+|[:=]\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)/iu,
  );

  if (!match) return null;

  const priceCents = Math.round(Number(match[1].replace(",", ".")) * 100);
  return Number.isSafeInteger(priceCents) && priceCents >= 0
    ? priceCents
    : null;
}

/**
 * Matching volontairement prudent : les mots significatifs du libellé doivent
 * tous apparaître, dans le même ordre et à la suite dans la demande. Aucun
 * rapprochement sémantique ou tarifaire approximatif n'est effectué.
 */
export function matchCatalogServicesForQuote(
  message: string,
  services: QuoteCatalogMatchSource[],
): EditableQuoteLine[] {
  const messageTokens = tokenize(message);
  const candidates = services
    .map((service) => ({
      service,
      serviceTokens: tokenize(service.name),
    }))
    .filter(({ serviceTokens }) => serviceTokens.length > 0)
    .sort((left, right) => right.serviceTokens.length - left.serviceTokens.length);

  const occupiedRanges: Array<{ start: number; end: number }> = [];
  const matches: Array<{ start: number; line: EditableQuoteLine }> = [];

  for (const { service, serviceTokens } of candidates) {
    const range = findTokenSequence(messageTokens, serviceTokens);
    if (!range) continue;

    const overlapsLongerMatch = occupiedRanges.some(
      (occupied) => range.start < occupied.end && range.end > occupied.start,
    );
    if (overlapsLongerMatch) continue;

    const explicitPriceCents = getExplicitPriceCents(message, range.end);
    const priceCents = explicitPriceCents ?? service.priceCents;

    occupiedRanges.push(range);
    matches.push({
      start: range.start,
      line: {
        category: service.name,
        quantity: "1",
        unit: "forfait",
        unitPrice: (priceCents / 100).toFixed(2),
        discount: "",
        cost: "",
      },
    });
  }

  return matches
    .sort((left, right) => left.start - right.start)
    .slice(0, 20)
    .map(({ line }) => line);
}

export function serializeQuoteLines(lines: EditableQuoteLine[]) {
  return JSON.stringify(lines.slice(0, 20));
}

const PRICE_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

export function parseSerializedQuoteLines(
  value: string | undefined,
): EditableQuoteLine[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((raw): EditableQuoteLine | null => {
        if (!raw || typeof raw !== "object") return null;
        const line = raw as Record<string, unknown>;

        const category =
          typeof line.category === "string" ? line.category.trim() : "";
        if (!category) return null;

        // "unitPrice" (nouveau format) ou "amount" (ancien lien transitoire).
        const rawUnitPrice =
          typeof line.unitPrice === "string"
            ? line.unitPrice
            : typeof line.amount === "string"
              ? line.amount
              : "";
        const unitPrice = rawUnitPrice.trim().replace(",", ".");
        if (!PRICE_PATTERN.test(unitPrice)) return null;

        const quantity =
          typeof line.quantity === "string" && line.quantity.trim()
            ? line.quantity.trim().replace(",", ".")
            : "1";
        const unit =
          typeof line.unit === "string" && line.unit.trim()
            ? line.unit.trim().slice(0, 16)
            : "forfait";
        const discount =
          typeof line.discount === "string" ? line.discount.trim() : "";
        const cost =
          typeof line.cost === "string" && PRICE_PATTERN.test(line.cost.trim())
            ? line.cost.trim().replace(",", ".")
            : "";

        return {
          category: category.slice(0, 160),
          quantity,
          unit,
          unitPrice,
          discount: PRICE_PATTERN.test(discount) ? discount : "",
          cost,
          ...(typeof line.vatRateBp === "number"
            ? { vatRateBp: line.vatRateBp }
            : {}),
        };
      })
      .filter((line): line is EditableQuoteLine => line !== null)
      .slice(0, 20);
  } catch {
    return [];
  }
}
