import type { EditableQuoteLine } from "@/src/lib/quote-lines";
import type { PersistableDocumentLine } from "@/src/lib/document-lines";

export type TemplateLineLike = {
  category: string;
  label: string | null;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  costCents: number | null;
  discountBp: number;
  vatRateBp: number;
};

/** Lignes de modèle -> lignes éditables pour préremplir `QuoteLinesForm`. */
export function templateLinesToEditable(
  lines: TemplateLineLike[],
): EditableQuoteLine[] {
  return lines.map((line) => ({
    category: line.label || line.category,
    quantity: (line.quantityMilli / 1000).toString(),
    unit: line.unit,
    unitPrice: (line.unitPriceCents / 100).toFixed(2),
    discount: line.discountBp > 0 ? String(line.discountBp / 100) : "",
    cost:
      line.costCents != null ? (line.costCents / 100).toFixed(2) : "",
    vatRateBp: line.vatRateBp,
    details: [],
  }));
}

/** Lignes de formulaire (persistables) -> données de lignes de modèle. */
export function persistableToTemplateLineData(
  lines: PersistableDocumentLine[],
): Array<Omit<TemplateLineLike, "label"> & { label: string | null; position: number }> {
  return lines.map((line, position) => ({
    category: line.category,
    label: line.label,
    quantityMilli: line.quantityMilli,
    unit: line.unit,
    unitPriceCents: line.unitPriceCents,
    costCents: line.costCents,
    discountBp: line.discountBp,
    vatRateBp: line.vatRateBp,
    position,
  }));
}
