import { sumIssuedCreditsCents, type CreditNoteAmountRecord } from "@/src/lib/credit-notes";
import { computeInvoicePaymentState, type PaymentRecord } from "@/src/lib/payments";

export type ClientFinancialInvoice = {
  status: string;
  amountCents: number;
  payments: PaymentRecord[];
  creditNotes: CreditNoteAmountRecord[];
};

export function computeClientFinancialSummary(invoices: ClientFinancialInvoice[]) {
  return invoices.reduce((summary, invoice) => {
    if (invoice.status === "BROUILLON" || invoice.status === "ANNULEE") return summary;
    const credits = sumIssuedCreditsCents(invoice.creditNotes);
    const payment = computeInvoicePaymentState(invoice.amountCents, invoice.payments, credits);
    summary.billedCents += Math.max(0, invoice.amountCents - credits);
    summary.collectedCents += payment.collectedCents;
    summary.remainingCents += payment.remainingCents;
    return summary;
  }, { billedCents: 0, collectedCents: 0, remainingCents: 0 });
}
