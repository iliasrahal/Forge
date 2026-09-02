export type EditableQuoteLine = {
  category: string;
  amount: string;
};

export type QuoteServiceSnapshotSource = {
  name: string;
  priceCents: number;
};

export function createQuoteLineSnapshot(
  service: QuoteServiceSnapshotSource,
): EditableQuoteLine {
  return {
    category: service.name,
    amount: (service.priceCents / 100).toFixed(2),
  };
}

export function calculateQuoteLinesTotal(lines: EditableQuoteLine[]) {
  return lines.reduce(
    (sum, line) => sum + (Number(line.amount.replace(",", ".")) || 0),
    0,
  );
}
