import { computeInvoicePaymentState, type PaymentRecord } from "@/src/lib/payments";

export type ProfitabilityInput = {
  quote?: { status: string; amountCents: number; totalCostCents: number } | null;
  invoices: Array<{ status: string; amountCents: number; payments: PaymentRecord[] }>;
  expenses: Array<{ amountCents: number }>;
  workTimes: Array<{ durationMinutes: number | null; hourlyCostCents: number | null }>;
};

export function computeInterventionProfitability(input: ProfitabilityInput) {
  const acceptedQuote = input.quote?.status === "ACCEPTE" ? input.quote : null;
  const billedInvoices = input.invoices.filter((invoice) =>
    invoice.status !== "BROUILLON" && invoice.status !== "ANNULEE",
  );
  const plannedRevenueCents = acceptedQuote?.amountCents ?? null;
  const plannedCostCents = acceptedQuote?.totalCostCents ?? null;
  const plannedMarginCents = plannedRevenueCents !== null && plannedCostCents !== null
    ? plannedRevenueCents - plannedCostCents
    : null;
  const billedRevenueCents = billedInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const collectedRevenueCents = input.invoices.reduce(
    (sum, invoice) => sum + computeInvoicePaymentState(invoice.amountCents, invoice.payments).collectedCents,
    0,
  );
  const expenseCents = input.expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const laborCostCents = input.workTimes.reduce((sum, entry) => {
    if (entry.durationMinutes === null || entry.hourlyCostCents === null) return sum;
    return sum + Math.round((entry.durationMinutes * entry.hourlyCostCents) / 60);
  }, 0);
  const workedMinutes = input.workTimes.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
  const actualMarginCents = billedRevenueCents - expenseCents - laborCostCents;

  return {
    plannedRevenueCents,
    plannedCostCents,
    plannedMarginCents,
    billedRevenueCents,
    collectedRevenueCents,
    expenseCents,
    laborCostCents,
    workedMinutes,
    actualMarginCents,
    marginVarianceCents: plannedMarginCents === null ? null : actualMarginCents - plannedMarginCents,
  };
}

export function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  return `${Math.floor(safe / 60)}h${String(safe % 60).padStart(2, "0")}`;
}
