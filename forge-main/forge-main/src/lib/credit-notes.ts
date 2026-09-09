/**
 * Avoirs (notes de crédit). Un avoir émis réduit le montant effectivement dû
 * sur la facture d'origine. Le calcul du reste dû vit dans `payments.ts`
 * (`computeInvoicePaymentState`, paramètre `creditedCents`).
 */

export const CREDIT_NOTE_STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  EMISE: "Émis",
  ANNULEE: "Annulé",
};

export const CREDIT_NOTE_MODE_LABELS: Record<string, string> = {
  FULL: "Avoir total",
  PARTIAL: "Avoir partiel",
};

export type CreditNoteAmountRecord = {
  status: string; // CreditNoteStatus
  amountCents: number;
};

/** Montant total couvert par les avoirs émis d'une facture. */
export function sumIssuedCreditsCents(
  creditNotes: CreditNoteAmountRecord[],
): number {
  let total = 0;
  for (const creditNote of creditNotes) {
    if (creditNote.status !== "EMISE") continue;
    total += Math.max(0, Math.round(creditNote.amountCents || 0));
  }
  return total;
}

/**
 * Ce qu'un nouvel avoir peut au plus couvrir : le TTC de la facture moins ce
 * qui est déjà couvert par des avoirs émis. On n'émet jamais plus d'avoir que
 * le montant facturé.
 */
export function maxCreditableCents(
  invoiceTtcCents: number,
  alreadyCreditedCents: number,
): number {
  return Math.max(
    0,
    Math.round(invoiceTtcCents || 0) - Math.max(0, Math.round(alreadyCreditedCents || 0)),
  );
}

/** Un avoir ne se crée que depuis une facture réellement émise. */
export function canCreateCreditNote(invoiceStatus: string): boolean {
  return invoiceStatus !== "BROUILLON" && invoiceStatus !== "ANNULEE";
}

export type PersistableCreditNoteLine = {
  category: string;
  label: string | null;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  discountBp: number;
  amountCents: number;
  vatRateBp: number;
};

type InvoiceLineLike = {
  category: string;
  label: string | null;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  discountBp: number;
  amountCents: number;
  vatRateBp: number;
};

/**
 * Avoir total : reprise à l'identique des lignes de la facture. Les montants
 * restent positifs — c'est la nature « avoir » du document qui les rend
 * soustractifs, pas leur signe.
 */
export function buildFullCreditNoteLinesFromInvoice(
  invoiceLines: InvoiceLineLike[],
): PersistableCreditNoteLine[] {
  return invoiceLines.map((line) => ({
    category: line.category,
    label: line.label ?? null,
    quantityMilli: line.quantityMilli,
    unit: line.unit,
    unitPriceCents: line.unitPriceCents,
    discountBp: line.discountBp,
    amountCents: line.amountCents,
    vatRateBp: line.vatRateBp,
  }));
}
