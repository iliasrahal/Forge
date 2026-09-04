/**
 * État de règlement d'une facture, dérivé de ses paiements.
 * Le statut PAYEE de la facture n'est jamais posé « à la main » : il découle
 * de la somme des paiements réussis (moins les remboursements).
 */

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Carte",
  bank_transfer: "Virement",
  virement: "Virement",
  cheque: "Chèque",
  especes: "Espèces",
};

export const MANUAL_PAYMENT_METHODS = ["virement", "cheque", "especes"] as const;
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

export function isManualPaymentMethod(
  value: unknown,
): value is ManualPaymentMethod {
  return (MANUAL_PAYMENT_METHODS as readonly string[]).includes(String(value));
}

export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return "Paiement";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export type PaymentRecord = {
  status: string; // PaymentStatus
  amountCents: number;
  feeCents: number;
  refundedCents: number;
  paidAt?: Date | string | null;
};

export type InvoicePaymentState = {
  /** Net encaissé : Σ (montant − remboursé) des paiements réussis, borné à 0. */
  collectedCents: number;
  /** Frais prestataire cumulés sur les paiements réussis. */
  feeCents: number;
  /** Ce qui revient réellement à l'artisan : encaissé − frais. */
  netCents: number;
  /** Reste dû par le client. */
  remainingCents: number;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  lastPaidAt: Date | null;
};

export function computeInvoicePaymentState(
  invoiceTtcCents: number,
  payments: PaymentRecord[],
): InvoicePaymentState {
  let collected = 0;
  let fee = 0;
  let last: Date | null = null;

  for (const payment of payments) {
    if (payment.status !== "SUCCEEDED") continue;
    collected +=
      Math.round(payment.amountCents || 0) -
      Math.round(payment.refundedCents || 0);
    fee += Math.round(payment.feeCents || 0);
    const when = payment.paidAt ? new Date(payment.paidAt) : null;
    if (when && !Number.isNaN(when.getTime()) && (!last || when > last)) {
      last = when;
    }
  }

  collected = Math.max(0, collected);
  const remaining = Math.max(0, invoiceTtcCents - collected);

  return {
    collectedCents: collected,
    feeCents: fee,
    netCents: Math.max(0, collected - fee),
    remainingCents: remaining,
    isFullyPaid: invoiceTtcCents > 0 && collected >= invoiceTtcCents,
    isPartiallyPaid: collected > 0 && collected < invoiceTtcCents,
    lastPaidAt: last,
  };
}

/**
 * Nouveau statut de facture après un changement de paiement. Ne touche jamais
 * un brouillon ni une facture annulée.
 */
export function resolveInvoiceStatusAfterPayment(params: {
  currentStatus: string;
  dueDate?: Date | string | null;
  state: InvoicePaymentState;
  now?: Date;
}): { status: string; paidAt: Date | null } {
  const { currentStatus, state } = params;

  if (currentStatus === "BROUILLON" || currentStatus === "ANNULEE") {
    return { status: currentStatus, paidAt: null };
  }

  if (state.isFullyPaid) {
    return { status: "PAYEE", paidAt: state.lastPaidAt ?? new Date() };
  }

  // Plus totalement payée (remboursement) : on retombe sur EN_RETARD si
  // l'échéance est passée, sinon ENVOYEE.
  const now = params.now ?? new Date();
  const due = params.dueDate ? new Date(params.dueDate) : null;
  const overdue =
    due != null &&
    !Number.isNaN(due.getTime()) &&
    due.getTime() < now.getTime();

  return { status: overdue ? "EN_RETARD" : "ENVOYEE", paidAt: null };
}
