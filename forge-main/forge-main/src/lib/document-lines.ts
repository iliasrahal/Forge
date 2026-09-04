import { normalizeVatRateBp } from "@/src/lib/vat";

/**
 * Lignes de devis / facture : quantité × prix unitaire, unité, remise de
 * ligne, déboursé sec (marge). Tout en entiers : quantité en milliunités
 * (1000 = 1), montants en centimes, remise en points de base.
 */

export const DOCUMENT_UNITS = [
  { value: "forfait", label: "forfait" },
  { value: "h", label: "h" },
  { value: "j", label: "jour" },
  { value: "m2", label: "m²" },
  { value: "m3", label: "m³" },
  { value: "ml", label: "ml" },
  { value: "u", label: "unité" },
  { value: "kg", label: "kg" },
  { value: "lot", label: "lot" },
] as const;

const UNIT_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_UNITS.map((entry) => [entry.value, entry.label]),
);

export function isValidUnit(value: string): boolean {
  return value in UNIT_LABELS;
}

export function normalizeUnit(value: unknown, fallback = "forfait"): string {
  const text = String(value ?? "").trim();
  return isValidUnit(text) ? text : fallback;
}

export function formatUnit(value: string): string {
  return UNIT_LABELS[value] ?? value;
}

/** 12500 -> "12,5" ; 1000 -> "1". */
export function formatQuantity(quantityMilli: number): string {
  return (Math.round(quantityMilli) / 1000).toLocaleString("fr-FR", {
    maximumFractionDigits: 3,
  });
}

/** "12,5" / "12.5" -> 12500. Valeur invalide -> fallback (1000 par défaut). */
export function parseQuantityToMilli(
  value: unknown,
  fallback = 1000,
): number {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!/^\d+(?:\.\d{1,3})?$/.test(normalized)) return fallback;
  const milli = Math.round(Number(normalized) * 1000);
  return Number.isSafeInteger(milli) && milli >= 0 ? milli : fallback;
}

export function normalizeDiscountBp(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseFloat(
          String(value ?? "")
            .trim()
            .replace(",", "."),
        );
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  // Saisi en pourcentage dans l'UI ; borné à 100 %.
  return Math.min(Math.round(parsed * 100), 10000);
}

export type DocumentLineInput = {
  quantityMilli: number;
  unitPriceCents: number;
  discountBp: number;
  costCents?: number | null;
};

/** Montant HT de la ligne : quantité × PU, remise de ligne appliquée. */
export function computeLineAmountCents(line: DocumentLineInput): number {
  const gross = (line.quantityMilli || 0) * (line.unitPriceCents || 0);
  const discounted = (gross * (10000 - (line.discountBp || 0))) / 10000;
  return Math.round(discounted / 1000);
}

/** Coût total (déboursé) de la ligne : quantité × coût unitaire. */
export function computeLineCostCents(line: DocumentLineInput): number {
  if (line.costCents == null) return 0;
  return Math.round(((line.quantityMilli || 0) * line.costCents) / 1000);
}

export type DocumentMargin = {
  totalCostCents: number;
  totalMarginCents: number;
};

/**
 * Marge du document : Σ montant HT des lignes − Σ coûts.
 * `amountCents` doit être le HT déjà calculé (remise de ligne incluse) ;
 * la remise globale éventuelle est passée à part.
 */
function eurosToCents(value: unknown): number {
  return Math.round(
    (Number(String(value ?? "").replace(",", ".")) || 0) * 100,
  );
}

export type PersistableDocumentLine = {
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

/**
 * Transforme le JSON du champ caché du formulaire (lignes éditables, tout en
 * chaînes) en lignes persistables, montant HT calculé. Garde les lignes qui
 * ont une désignation et un prix unitaire > 0.
 */
export function buildDocumentLinesFromForm(
  rawJson: string | undefined,
  orgDefaultVatRateBp: number,
): PersistableDocumentLine[] {
  if (!rawJson) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((raw): PersistableDocumentLine | null => {
      if (!raw || typeof raw !== "object") return null;
      const line = raw as Record<string, unknown>;

      const category =
        typeof line.category === "string" ? line.category.trim() : "";
      const unitPriceCents = eurosToCents(line.unitPrice);
      if (!category || unitPriceCents <= 0) return null;

      const quantityMilli = parseQuantityToMilli(line.quantity, 1000);
      const discountBp = normalizeDiscountBp(line.discount);
      const costCents =
        typeof line.cost === "string" && line.cost.trim()
          ? eurosToCents(line.cost)
          : null;
      const amountCents = computeLineAmountCents({
        quantityMilli,
        unitPriceCents,
        discountBp,
      });

      return {
        category: category.slice(0, 200),
        label: category.slice(0, 200),
        quantityMilli,
        unit: normalizeUnit(line.unit),
        unitPriceCents,
        costCents,
        discountBp,
        amountCents,
        vatRateBp: normalizeVatRateBp(line.vatRateBp, orgDefaultVatRateBp),
      };
    })
    .filter((line): line is PersistableDocumentLine => line !== null)
    .slice(0, 60);
}

export function computeDocumentMargin(
  lines: Array<DocumentLineInput & { amountCents: number }>,
  documentDiscountBp = 0,
): DocumentMargin {
  const htAfterLineDiscount = lines.reduce(
    (sum, line) => sum + Math.round(line.amountCents || 0),
    0,
  );
  const htAfterDocDiscount = Math.round(
    (htAfterLineDiscount * (10000 - documentDiscountBp)) / 10000,
  );
  const totalCostCents = lines.reduce(
    (sum, line) => sum + computeLineCostCents(line),
    0,
  );
  return {
    totalCostCents,
    totalMarginCents: htAfterDocDiscount - totalCostCents,
  };
}
