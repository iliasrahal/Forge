/**
 * TVA — calcul des totaux d'un devis / d'une facture.
 *
 * Les taux sont exprimés en points de base (bp) pour rester entiers, comme les
 * montants en centimes : 2000 = 20 %, 1000 = 10 %, 550 = 5,5 %, 0 = 0 %.
 * Chaque ligne porte un montant HT (`amountCents`) et son taux (`vatRateBp`).
 * La TVA est calculée par taux, sur la base agrégée, arrondie au centime.
 */

export type VatSchemeValue = "SUBJECT" | "FRANCHISE_BASE";

export const VAT_RATES_BP = [2000, 1000, 550, 0] as const;

export type VatRateBp = (typeof VAT_RATES_BP)[number];

export const VAT_RATE_LABELS: Record<number, string> = {
  2000: "20 %",
  1000: "10 %",
  550: "5,5 %",
  0: "0 %",
};

/** Mention légale obligatoire pour la franchise en base de TVA. */
export const VAT_EXEMPTION_MENTION =
  "TVA non applicable, art. 293 B du CGI";

export function isValidVatRateBp(value: number): value is VatRateBp {
  return (VAT_RATES_BP as readonly number[]).includes(value);
}

/** Normalise une valeur reçue d'un formulaire vers un taux connu. */
export function normalizeVatRateBp(
  value: unknown,
  fallback: number = 2000,
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);

  return isValidVatRateBp(parsed) ? parsed : fallback;
}

export function formatVatRateBp(rateBp: number): string {
  return (
    VAT_RATE_LABELS[rateBp] ??
    `${(rateBp / 100).toLocaleString("fr-FR", {
      maximumFractionDigits: 2,
    })} %`
  );
}

export function vatApplicableForScheme(scheme: VatSchemeValue): boolean {
  return scheme === "SUBJECT";
}

export type VatLineInput = {
  /** Montant HT de la ligne, en centimes. */
  amountCents: number;
  /** Taux de TVA en points de base. */
  vatRateBp: number;
};

export type VatRateBreakdown = {
  rateBp: number;
  baseCents: number;
  vatCents: number;
};

export type DocumentTotals = {
  totalHtCents: number;
  totalVatCents: number;
  totalTtcCents: number;
  /** Ventilation par taux, triée du taux le plus élevé au plus faible.
   *  Vide quand la TVA n'est pas applicable. */
  byRate: VatRateBreakdown[];
};

/**
 * Calcule HT / TVA / TTC pour un ensemble de lignes.
 * `line.amountCents` = HT de la ligne (remise de ligne déjà appliquée).
 * `documentDiscountBp` = remise globale de pied, appliquée après les lignes
 * et avant la TVA (0 par défaut, comportement identique à l'existant).
 * Quand `vatApplicable` est faux, TTC = HT et aucune TVA n'est ventilée.
 */
export function computeDocumentTotals(
  lines: VatLineInput[],
  vatApplicable: boolean,
  documentDiscountBp = 0,
): DocumentTotals {
  const discountFactor = 10000 - Math.max(0, Math.min(documentDiscountBp, 10000));

  if (!vatApplicable) {
    const htBeforeDoc = lines.reduce(
      (sum, line) => sum + Math.round(line.amountCents || 0),
      0,
    );
    const totalHtCents = Math.round((htBeforeDoc * discountFactor) / 10000);
    return {
      totalHtCents,
      totalVatCents: 0,
      totalTtcCents: totalHtCents,
      byRate: [],
    };
  }

  const basesByRate = new Map<number, number>();

  for (const line of lines) {
    const rateBp = normalizeVatRateBp(line.vatRateBp, 0);
    const base = Math.round(line.amountCents || 0);
    basesByRate.set(rateBp, (basesByRate.get(rateBp) ?? 0) + base);
  }

  const byRate: VatRateBreakdown[] = [...basesByRate.entries()]
    .map(([rateBp, rawBase]) => {
      const baseCents = Math.round((rawBase * discountFactor) / 10000);
      return {
        rateBp,
        baseCents,
        vatCents: Math.round((baseCents * rateBp) / 10000),
      };
    })
    .filter((entry) => entry.baseCents !== 0)
    .sort((a, b) => b.rateBp - a.rateBp);

  const totalHtCents = byRate.reduce((sum, entry) => sum + entry.baseCents, 0);
  const totalVatCents = byRate.reduce(
    (sum, entry) => sum + entry.vatCents,
    0,
  );

  return {
    totalHtCents,
    totalVatCents,
    totalTtcCents: totalHtCents + totalVatCents,
    byRate,
  };
}
