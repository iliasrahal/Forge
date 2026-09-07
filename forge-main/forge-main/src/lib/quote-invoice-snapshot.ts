type QuoteLineSnapshot = {
  category: string;
  label: string | null;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  costCents: number | null;
  discountBp: number;
  amountCents: number;
  vatRateBp: number;
};

type QuoteSnapshotSource = {
  title: string;
  description: string | null;
  amountCents: number;
  vatApplicable: boolean;
  totalHtCents: number;
  totalVatCents: number;
  discountBp: number;
  totalCostCents: number;
  lines: QuoteLineSnapshot[];
};

export function buildInvoiceSnapshotFromQuote(quote: QuoteSnapshotSource) {
  return {
    title: `Facture - ${quote.title}`,
    description: quote.description?.trim() || null,
    amountCents: quote.amountCents,
    vatApplicable: quote.vatApplicable,
    totalHtCents: quote.totalHtCents,
    totalVatCents: quote.totalVatCents,
    discountBp: quote.discountBp,
    totalCostCents: quote.totalCostCents,
    lines: quote.lines.map((line) => ({ ...line })),
  };
}
