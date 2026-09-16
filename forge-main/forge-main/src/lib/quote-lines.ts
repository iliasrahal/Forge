import { normalizeVatRateBp } from "@/src/lib/vat";
import type { MaterialImageView } from "@/src/lib/material-images";

export type EditableQuoteLine = {
  lineType?: string;
  category: string;
  /** Quantité affichée : "12,5". */
  quantity: string;
  /** Unité : "forfait", "h", "m2"... */
  unit: string;
  /** Prix unitaire HT en euros : "45.00". */
  unitPrice: string;
  /** Remise de ligne en pourcentage : "10" ("" ou "0" = aucune). */
  discount: string;
  /** Déboursé sec unitaire en euros ("" = marge non suivie). */
  cost: string;
  /** Taux de TVA en points de base. Absent = repli sur le taux par défaut. */
  vatRateBp?: number;
  details?: EditableLineDetail[];
  material?: EditableMaterialSnapshot;
  sourceWork?: {
    templateId: string;
    templateName: string;
    templateVersionAt: string;
  };
};

export type EditableMaterialSnapshot = {
  catalogItemId: string | null;
  workspaceMaterialId: string | null;
  name: string;
  brand: string;
  reference: string;
  specifications: Record<string, string>;
  supplier: string;
};

export type EditableLineDetail = {
  label: string;
  /** Quantité affichée, mêmes règles que la ligne : "1" par défaut. */
  quantity: string;
  /** Unité : "forfait", "h", "m2"... */
  unit: string;
  /** Prix unitaire HT en euros ; chaîne vide = aucun prix (note purement
   *  informative, non chiffrée). */
  unitPrice: string;
  description: string;
};

export type QuoteServiceSnapshotSource = {
  name: string;
  priceCents: number;
  pricingType?: "FIXED" | "HOURLY" | "UNIT";
};

export function emptyQuoteLine(
  category = "",
  defaultVatRateBp?: number,
): EditableQuoteLine {
  return {
    lineType: "OTHER",
    category,
    quantity: "1",
    unit: "forfait",
    unitPrice: "",
    discount: "",
    cost: "",
    details: [],
    ...(defaultVatRateBp !== undefined
      ? { vatRateBp: normalizeVatRateBp(defaultVatRateBp, 2000) }
      : {}),
  };
}

export function createQuoteLineSnapshot(
  service: QuoteServiceSnapshotSource,
  defaultVatRateBp?: number,
): EditableQuoteLine {
  return {
    lineType: "SERVICE",
    category: service.name,
    quantity: "1",
    unit: service.pricingType === "HOURLY" ? "h" : service.pricingType === "UNIT" ? "u" : "forfait",
    unitPrice: (service.priceCents / 100).toFixed(2),
    discount: "",
    cost: "",
    details: [],
    ...(defaultVatRateBp !== undefined
      ? { vatRateBp: normalizeVatRateBp(defaultVatRateBp, 2000) }
      : {}),
  };
}

export type QuoteMaterialSnapshotSource = EditableMaterialSnapshot & {
  salePriceCents: number;
  purchasePriceCents: number | null;
  unit: string;
  /** Aide visuelle courante uniquement, volontairement absente du snapshot du document. */
  primaryImage?: MaterialImageView | null;
  imageCount?: number;
};

export function createMaterialLineSnapshot(
  material: QuoteMaterialSnapshotSource,
  defaultVatRateBp?: number,
): EditableQuoteLine {
  return {
    lineType: "MATERIAL",
    category: material.name,
    quantity: "1",
    unit: material.unit || "u",
    unitPrice: (material.salePriceCents / 100).toFixed(2),
    discount: "",
    cost:
      material.purchasePriceCents == null
        ? ""
        : (material.purchasePriceCents / 100).toFixed(2),
    details: [],
    material: {
      catalogItemId: material.catalogItemId,
      workspaceMaterialId: material.workspaceMaterialId,
      name: material.name,
      brand: material.brand,
      reference: material.reference,
      specifications: material.specifications,
      supplier: material.supplier,
    },
    ...(defaultVatRateBp !== undefined
      ? { vatRateBp: normalizeVatRateBp(defaultVatRateBp, 2000) }
      : {}),
  };
}

export function placeMaterialInDocumentLines(
  lines: EditableQuoteLine[],
  material: QuoteMaterialSnapshotSource,
  defaultVatRateBp?: number,
) {
  const snapshot = createMaterialLineSnapshot(material, defaultVatRateBp);
  const materialLineIndex = lines.findIndex((line) =>
    line.category
      .trim()
      .toLocaleLowerCase("fr")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") === "materiel",
  );

  if (materialLineIndex < 0) return [...lines, snapshot];

  return lines.map((line, index) =>
    index === materialLineIndex
      ? { ...snapshot, category: line.category.trim() || "Matériel" }
      : line,
  );
}
