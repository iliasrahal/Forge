import type { EditableQuoteLine } from "@/src/lib/quote-lines";
import type { PersistableDocumentLine } from "@/src/lib/document-lines";

export type TemplateLineLike = {
  lineType?: string | null;
  category: string;
  label: string | null;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  costCents: number | null;
  discountBp: number;
  vatRateBp: number;
  materialCatalogItemId?: string | null;
  workspaceMaterialId?: string | null;
  materialName?: string | null;
  materialBrand?: string | null;
  materialReference?: string | null;
  materialSpecifications?: unknown;
  materialSupplier?: string | null;
  details?: Array<{ label: string; description: string | null; quantityMilli: number; unit: string; unitPriceCents: number | null }>;
};

/** Lignes de modèle -> lignes éditables pour préremplir `QuoteLinesForm`. */
export function templateLinesToEditable(
  lines: TemplateLineLike[],
): EditableQuoteLine[] {
  return lines.map((line) => ({
    lineType: line.lineType ?? "OTHER",
    category: line.label || line.category,
    quantity: (line.quantityMilli / 1000).toString(),
    unit: line.unit,
    unitPrice: (line.unitPriceCents / 100).toFixed(2),
    discount: line.discountBp > 0 ? String(line.discountBp / 100) : "",
    cost:
      line.costCents != null ? (line.costCents / 100).toFixed(2) : "",
    vatRateBp: line.vatRateBp,
    ...(line.materialName ? { material: {
      catalogItemId: line.materialCatalogItemId ?? null,
      workspaceMaterialId: line.workspaceMaterialId ?? null,
      name: line.materialName,
      brand: line.materialBrand ?? "",
      reference: line.materialReference ?? "",
      specifications: line.materialSpecifications && typeof line.materialSpecifications === "object" && !Array.isArray(line.materialSpecifications) ? line.materialSpecifications as Record<string, string> : {},
      supplier: line.materialSupplier ?? "",
    } } : {}),
    details: (line.details ?? []).map((detail) => ({
      label: detail.label,
      description: detail.description ?? "",
      quantity: String(detail.quantityMilli / 1000),
      unit: detail.unit,
      unitPrice: detail.unitPriceCents == null ? "" : (detail.unitPriceCents / 100).toFixed(2),
    })),
  }));
}

/** Lignes de formulaire (persistables) -> données de lignes de modèle. */
export function persistableToTemplateLineData(
  lines: PersistableDocumentLine[],
) {
  return lines.map((line, position) => ({
    lineType: line.lineType,
    category: line.category,
    label: line.label,
    quantityMilli: line.quantityMilli,
    unit: line.unit,
    unitPriceCents: line.unitPriceCents,
    costCents: line.costCents,
    discountBp: line.discountBp,
    vatRateBp: line.vatRateBp,
    position,
    materialCatalogItemId: line.materialCatalogItemId,
    workspaceMaterialId: line.workspaceMaterialId,
    materialName: line.materialName,
    materialBrand: line.materialBrand,
    materialReference: line.materialReference,
    ...(line.materialSpecifications ? { materialSpecifications: line.materialSpecifications } : {}),
    materialSupplier: line.materialSupplier,
    ...(line.details.length ? { details: { create: line.details } } : {}),
  }));
}
