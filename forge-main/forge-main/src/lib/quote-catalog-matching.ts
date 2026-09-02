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
        amount: (priceCents / 100).toFixed(2),
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

export function parseSerializedQuoteLines(value: string | undefined) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (line): line is EditableQuoteLine =>
          Boolean(
            line &&
              typeof line === "object" &&
              typeof (line as EditableQuoteLine).category === "string" &&
              typeof (line as EditableQuoteLine).amount === "string" &&
              (line as EditableQuoteLine).category.trim() &&
              /^\d+(?:[.,]\d{1,2})?$/.test(
                (line as EditableQuoteLine).amount.trim(),
              ),
          ),
      )
      .slice(0, 20)
      .map((line) => ({
        category: line.category.trim().slice(0, 160),
        amount: line.amount.trim().replace(",", "."),
      }));
  } catch {
    return [];
  }
}
