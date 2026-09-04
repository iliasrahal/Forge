import { normalizeVatRateBp } from "@/src/lib/vat";

export type EditableQuoteLine = {
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
};

export type QuoteServiceSnapshotSource = {
  name: string;
  priceCents: number;
};

export function emptyQuoteLine(
  category = "",
  defaultVatRateBp?: number,
): EditableQuoteLine {
  return {
    category,
    quantity: "1",
    unit: "forfait",
    unitPrice: "",
    discount: "",
    cost: "",
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
    category: service.name,
    quantity: "1",
    unit: "forfait",
    unitPrice: (service.priceCents / 100).toFixed(2),
    discount: "",
    cost: "",
    ...(defaultVatRateBp !== undefined
      ? { vatRateBp: normalizeVatRateBp(defaultVatRateBp, 2000) }
      : {}),
  };
}
