/**
 * Facturation à l'avancement d'un devis : acompte, situations de travaux,
 * facture de solde, retenue de garantie.
 *
 * « Facturé » = somme TTC des factures non annulées rattachées au devis,
 * quel que soit leur type. Le registre indique où en est la facturation du
 * devis et la retenue de garantie cumulée.
 */

const BILLABLE_STATUSES = new Set(["BROUILLON", "ENVOYEE", "PAYEE", "EN_RETARD"]);

export type QuoteBillingInvoice = {
  type: string; // InvoiceType
  status: string; // InvoiceStatus
  amountCents: number;
  retentionCents?: number;
  situationProgressBp?: number | null;
};

export type QuoteBillingLedger = {
  quoteTtcCents: number;
  billedCents: number;
  billedBp: number;
  remainingCents: number;
  retentionWithheldCents: number;
  isFullyBilled: boolean;
  situationCount: number;
};

function countsAsBilled(invoice: QuoteBillingInvoice): boolean {
  return BILLABLE_STATUSES.has(invoice.status);
}

export function getQuoteBillingLedger(
  quoteTtcCents: number,
  invoices: QuoteBillingInvoice[],
): QuoteBillingLedger {
  let billed = 0;
  let retention = 0;
  let situationCount = 0;

  for (const invoice of invoices) {
    if (!countsAsBilled(invoice)) continue;
    billed += Math.max(0, Math.round(invoice.amountCents || 0));
    retention += Math.max(0, Math.round(invoice.retentionCents || 0));
    if (invoice.type === "SITUATION") situationCount += 1;
  }

  const remaining = Math.max(0, quoteTtcCents - billed);
  const billedBp =
    quoteTtcCents > 0
      ? Math.min(10000, Math.round((billed * 10000) / quoteTtcCents))
      : 0;

  return {
    quoteTtcCents,
    billedCents: billed,
    billedBp,
    remainingCents: remaining,
    retentionWithheldCents: retention,
    isFullyBilled: quoteTtcCents > 0 && billed >= quoteTtcCents,
    situationCount,
  };
}

/** Retenue de garantie sur un montant TTC, arrondie au centime. */
export function computeRetentionCents(
  amountTtcCents: number,
  retentionBp: number,
): number {
  const bp = Math.max(0, Math.min(10000, Math.round(retentionBp || 0)));
  return Math.round((Math.max(0, amountTtcCents) * bp) / 10000);
}

export type SituationAmountResult =
  | { ok: true; amountCents: number; cumulativeTargetCents: number }
  | { ok: false; error: string };

/**
 * Montant d'une nouvelle situation de travaux : la part du devis correspondant
 * à l'avancement cumulé visé, moins ce qui est déjà facturé.
 */
export function computeSituationInvoiceAmount(input: {
  quoteTtcCents: number;
  targetProgressBp: number;
  alreadyBilledCents: number;
}): SituationAmountResult {
  const bp = Math.round(input.targetProgressBp || 0);
  if (bp <= 0 || bp > 10000) {
    return { ok: false, error: "L’avancement doit être compris entre 1 et 100 %." };
  }

  const cumulativeTarget = Math.round((input.quoteTtcCents * bp) / 10000);
  const amountCents = cumulativeTarget - Math.max(0, input.alreadyBilledCents);

  if (amountCents <= 0) {
    return {
      ok: false,
      error:
        "Cet avancement est déjà facturé. Choisis un pourcentage supérieur.",
    };
  }
  if (cumulativeTarget > input.quoteTtcCents) {
    return { ok: false, error: "L’avancement dépasse le montant du devis." };
  }

  return { ok: true, amountCents, cumulativeTargetCents: cumulativeTarget };
}

/** Montant de la facture de solde : tout ce qui reste à facturer sur le devis. */
export function computeBalanceInvoiceAmount(
  quoteTtcCents: number,
  alreadyBilledCents: number,
): number {
  return Math.max(0, quoteTtcCents - Math.max(0, alreadyBilledCents));
}
