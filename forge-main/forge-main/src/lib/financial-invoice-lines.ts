import { computeDocumentTotals } from "@/src/lib/vat";

export type FinancialSourceLine = {
  id: string;
  lineType?: string | null;
  category: string;
  label: string | null;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  costCents: number | null;
  discountBp: number;
  amountCents: number;
  vatRateBp: number;
  materialCatalogItemId?: string | null;
  workspaceMaterialId?: string | null;
  materialName?: string | null;
  materialBrand?: string | null;
  materialReference?: string | null;
  materialSpecifications?: unknown;
  materialSupplier?: string | null;
  sourceWorkTemplateId?: string | null;
  sourceWorkTemplateName?: string | null;
  sourceWorkTemplateVersionAt?: Date | null;
  details?: Array<{ label: string; description: string | null; quantityMilli: number; unit: string; unitPriceCents: number | null; amountCents: number | null; position: number }>;
};

/**
 * Fige une tranche financière d'un devis dans des lignes de facture. La TVA
 * reste ventilée par taux de ligne et les centimes sont rapprochés du TTC
 * demandé. Le snapshot est indépendant du devis après création.
 */
export function buildFinancialInvoiceSlice(input: {
  lines: FinancialSourceLine[];
  quoteTtcCents: number;
  targetTtcCents: number;
  vatApplicable: boolean;
  discountBp: number;
}) {
  if (input.quoteTtcCents <= 0 || input.targetTtcCents <= 0 || input.lines.length === 0) {
    return { lines: [], totalHtCents: 0, totalVatCents: 0, totalTtcCents: 0, byRate: [] };
  }
  const ratio = Math.min(1, input.targetTtcCents / input.quoteTtcCents);
  const lines = input.lines.map((line) => ({
    ...line,
    quantityMilli: Math.max(1, Math.round(line.quantityMilli * ratio)),
    amountCents: Math.max(0, Math.round(line.amountCents * ratio)),
    costCents: line.costCents == null ? null : Math.max(0, Math.round(line.costCents * ratio)),
  }));
  let totals = computeDocumentTotals(lines, input.vatApplicable, input.discountBp);
  let guard = 0;
  while (totals.totalTtcCents !== input.targetTtcCents && guard < 500 && lines.length > 0) {
    const direction = totals.totalTtcCents < input.targetTtcCents ? 1 : -1;
    const candidate = lines.reduce((best, line) => line.amountCents > best.amountCents ? line : best, lines[0]);
    if (candidate.amountCents + direction < 0) break;
    candidate.amountCents += direction;
    totals = computeDocumentTotals(lines, input.vatApplicable, input.discountBp);
    guard += 1;
  }
  return { lines, ...totals };
}

export function financialInvoiceLineCreateData(line: FinancialSourceLine) {
  return {
    lineType: line.lineType ?? null,
    category: line.category,
    label: line.label,
    quantityMilli: line.quantityMilli,
    unit: line.unit,
    unitPriceCents: line.unitPriceCents,
    costCents: line.costCents,
    discountBp: line.discountBp,
    amountCents: line.amountCents,
    vatRateBp: line.vatRateBp,
    materialCatalogItemId: line.materialCatalogItemId ?? null,
    workspaceMaterialId: line.workspaceMaterialId ?? null,
    materialName: line.materialName ?? null,
    materialBrand: line.materialBrand ?? null,
    materialReference: line.materialReference ?? null,
    materialSpecifications: line.materialSpecifications ?? undefined,
    materialSupplier: line.materialSupplier ?? null,
    sourceWorkTemplateId: line.sourceWorkTemplateId ?? null,
    sourceWorkTemplateName: line.sourceWorkTemplateName ?? null,
    sourceWorkTemplateVersionAt: line.sourceWorkTemplateVersionAt ?? null,
    ...(line.details?.length ? { details: { create: line.details.map((detail) => ({ label: detail.label, description: detail.description, quantityMilli: detail.quantityMilli, unit: detail.unit, unitPriceCents: detail.unitPriceCents, amountCents: detail.amountCents, position: detail.position })) } } : {}),
  };
}
