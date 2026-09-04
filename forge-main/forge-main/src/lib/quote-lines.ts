import { normalizeVatRateBp } from "@/src/lib/vat";

export type EditableQuoteLine = {
  category: string;
  /** Montant HT de la ligne, saisi en euros ("1 240.00"). */
  amount: string;
  /** Taux de TVA en points de base. Absent = repli sur le taux par défaut. */
  vatRateBp?: number;
};

export type QuoteServiceSnapshotSource = {
  name: string;
  priceCents: number;
};

export function createQuoteLineSnapshot(
  service: QuoteServiceSnapshotSource,
  defaultVatRateBp?: number,
): EditableQuoteLine {
  return {
    category: service.name,
    amount: (service.priceCents / 100).toFixed(2),
    ...(defaultVatRateBp !== undefined
      ? { vatRateBp: normalizeVatRateBp(defaultVatRateBp, 2000) }
      : {}),
  };
}

export function calculateQuoteLinesTotal(lines: EditableQuoteLine[]) {
  return lines.reduce(
    (sum, line) => sum + (Number(line.amount.replace(",", ".")) || 0),
    0,
  );
}
