import { sumIssuedCreditsCents, type CreditNoteAmountRecord } from "@/src/lib/credit-notes";
import { computeInvoicePaymentState, type PaymentRecord } from "@/src/lib/payments";

type QuoteLineCost = { lineType?: string | null; quantityMilli: number; unit: string; costCents: number | null };
type ProfitabilityInvoice = { status: string; amountCents: number; payments: PaymentRecord[]; creditNotes?: CreditNoteAmountRecord[] };
type ProfitabilityExpense = { amountCents: number; category?: string | null };
type ProfitabilityWorkTime = { userId?: string; memberName?: string; durationMinutes: number | null; hourlyCostCents: number | null };
type ProfitabilityMaterial = { quantityMilli: number; actualUnitCostCents: number | null };

export type ProfitabilityInput = {
  quote?: { status: string; amountCents: number; totalCostCents: number; lines?: QuoteLineCost[] } | null;
  invoices: ProfitabilityInvoice[];
  expenses: ProfitabilityExpense[];
  workTimes: ProfitabilityWorkTime[];
  materialUsages?: ProfitabilityMaterial[];
};

function percentage(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return Math.round((numerator * 10_000) / denominator) / 100;
}

function costForLine(line: QuoteLineCost) {
  return line.costCents === null ? null : Math.round((line.quantityMilli * line.costCents) / 1000);
}

export function computeInterventionProfitability(input: ProfitabilityInput) {
  const acceptedQuote = input.quote?.status === "ACCEPTE" ? input.quote : null;
  const billedInvoices = input.invoices.filter((invoice) => invoice.status !== "BROUILLON" && invoice.status !== "ANNULEE");
  const soldRevenueCents = acceptedQuote?.amountCents ?? null;
  const plannedCostCents = acceptedQuote?.totalCostCents ?? null;
  const plannedMarginCents = soldRevenueCents !== null && plannedCostCents !== null ? soldRevenueCents - plannedCostCents : null;
  const plannedMarginPercent = percentage(plannedMarginCents, soldRevenueCents);

  const quoteLines = acceptedQuote?.lines ?? [];
  const plannedMaterialCostCents = quoteLines.filter((line) => line.lineType === "MATERIAL").reduce((sum, line) => sum + (costForLine(line) ?? 0), 0);
  const plannedLaborCostCents = quoteLines.filter((line) => line.lineType === "LABOR").reduce((sum, line) => sum + (costForLine(line) ?? 0), 0);
  const plannedLaborMinutes = quoteLines.filter((line) => line.lineType === "LABOR" && line.unit === "h").reduce((sum, line) => sum + Math.round(line.quantityMilli * 60 / 1000), 0);

  let creditedCents = 0;
  let billedRevenueCents = 0;
  let collectedRevenueCents = 0;
  for (const invoice of billedInvoices) {
    const invoiceCredits = sumIssuedCreditsCents(invoice.creditNotes ?? []);
    creditedCents += invoiceCredits;
    billedRevenueCents += Math.max(0, invoice.amountCents - invoiceCredits);
    collectedRevenueCents += computeInvoicePaymentState(invoice.amountCents, invoice.payments, invoiceCredits).collectedCents;
  }

  const materialUsages = input.materialUsages ?? [];
  const knownMaterialUsageCostCents = materialUsages.reduce((sum, usage) => usage.actualUnitCostCents === null ? sum : sum + Math.round((usage.quantityMilli * usage.actualUnitCostCents) / 1000), 0);
  const materialExpenseCents = input.expenses.filter((expense) => expense.category === "MATERIALS" || expense.category === "SUPPLIES").reduce((sum, expense) => sum + expense.amountCents, 0);
  // Achat et usage peuvent représenter le même coût. Sans lien explicite,
  // conserver la source la plus élevée évite leur addition automatique.
  const materialsCostCents = Math.max(knownMaterialUsageCostCents, materialExpenseCents);
  const materialsCostComplete = materialUsages.every((usage) => usage.actualUnitCostCents !== null);
  const expenseByCategory = (category: string) => input.expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amountCents, 0);
  const travelCostCents = expenseByCategory("TRAVEL");
  const rentalCostCents = expenseByCategory("RENTAL");
  const subcontractingCostCents = expenseByCategory("SUBCONTRACTING");
  const otherCostCents = input.expenses.filter((expense) => !["MATERIALS", "SUPPLIES", "TRAVEL", "RENTAL", "SUBCONTRACTING"].includes(expense.category ?? "OTHER")).reduce((sum, expense) => sum + expense.amountCents, 0);
  const nonMaterialExpenseCents = travelCostCents + rentalCostCents + subcontractingCostCents + otherCostCents;

  let laborCostCents = 0;
  let laborCostComplete = true;
  let workedMinutes = 0;
  const memberMap = new Map<string, { userId: string; memberName: string; workedMinutes: number; laborCostCents: number; costComplete: boolean }>();
  for (const entry of input.workTimes) {
    const duration = entry.durationMinutes ?? 0;
    workedMinutes += duration;
    const hasCost = entry.durationMinutes !== null && entry.hourlyCostCents !== null;
    if (!hasCost) laborCostComplete = false;
    const cost = hasCost ? Math.round((duration * entry.hourlyCostCents!) / 60) : 0;
    laborCostCents += cost;
    const key = entry.userId ?? entry.memberName ?? "unknown";
    const member = memberMap.get(key) ?? { userId: entry.userId ?? key, memberName: entry.memberName ?? "Membre", workedMinutes: 0, laborCostCents: 0, costComplete: true };
    member.workedMinutes += duration;
    member.laborCostCents += cost;
    member.costComplete = member.costComplete && hasCost;
    memberMap.set(key, member);
  }

  const totalCostComplete = laborCostComplete && materialsCostComplete;
  const totalCostCents = totalCostComplete ? materialsCostCents + laborCostCents + nonMaterialExpenseCents : null;
  const actualMarginCents = soldRevenueCents !== null && totalCostCents !== null ? soldRevenueCents - totalCostCents : null;
  const actualMarginPercent = percentage(actualMarginCents, soldRevenueCents);

  return {
    soldRevenueCents, plannedRevenueCents: soldRevenueCents, plannedCostCents,
    plannedMaterialCostCents, plannedLaborCostCents, plannedLaborMinutes,
    plannedMarginCents, plannedMarginPercent,
    grossBilledRevenueCents: billedRevenueCents + creditedCents,
    creditedCents, billedRevenueCents, collectedRevenueCents,
    materialsCostCents, knownMaterialUsageCostCents, materialExpenseCents,
    laborCostCents, nonMaterialExpenseCents,
    expenseCents: input.expenses.reduce((sum, expense) => sum + expense.amountCents, 0),
    travelCostCents, rentalCostCents, subcontractingCostCents, otherCostCents,
    totalCostCents, totalCostComplete, laborCostComplete, materialsCostComplete,
    workedMinutes, timeByMember: [...memberMap.values()],
    actualMarginCents, actualMarginPercent,
    costVarianceCents: plannedCostCents !== null && totalCostCents !== null ? totalCostCents - plannedCostCents : null,
    laborTimeVarianceMinutes: plannedLaborMinutes > 0 ? workedMinutes - plannedLaborMinutes : null,
    marginVarianceCents: plannedMarginCents !== null && actualMarginCents !== null ? actualMarginCents - plannedMarginCents : null,
  };
}

export type InterventionProfitability = ReturnType<typeof computeInterventionProfitability>;

export function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  return `${Math.floor(safe / 60)}h${String(safe % 60).padStart(2, "0")}`;
}
