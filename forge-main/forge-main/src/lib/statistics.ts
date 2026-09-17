import { getParisDayBounds, formatParisDateKey, isDateKey } from "@/src/lib/paris-datetime";
import { computeInvoicePaymentState, type PaymentRecord } from "@/src/lib/payments";
import { sumIssuedCreditsCents, type CreditNoteAmountRecord } from "@/src/lib/credit-notes";
import { computeInterventionProfitability, type ProfitabilityInput } from "@/src/lib/intervention-profitability";

export type StatisticsPeriod = "month" | "previousMonth" | "year" | "7d" | "30d" | "3m" | "6m" | "1y" | "custom";

export type StatisticsRange = {
  start: Date;
  endExclusive: Date;
  from: string;
  to: string;
  period: StatisticsPeriod;
};

export type StatisticsInvoice = {
  id: string;
  quoteId: string | null;
  clientId: string;
  amountCents: number;
  status: string;
  createdAt: Date;
  sentAt?: Date | null;
  payments: PaymentRecord[];
  creditNotes: CreditNoteAmountRecord[];
};

export type StatisticsQuote = {
  id: string;
  amountCents: number;
  status: string;
  sentAt: Date | null;
  acceptedAt?: Date | null;
  invoices: { status: string }[];
};

export type StatisticsPayment = PaymentRecord & {
  id: string;
  invoiceId: string;
  clientId: string;
  clientName: string;
  invoiceStatus: string;
};

export type StatisticsPoint = {
  key: string;
  label: string;
  billedCents: number;
  collectedCents: number;
};

export type StatisticsResult = {
  soldCents: number;
  billedCents: number;
  collectedCents: number;
  sentQuotes: number;
  acceptanceRate: number | null;
  quoteCounts: { accepted: number; refused: number; pending: number };
  averageQuoteCents: number;
  quoteToInvoiceRate: number | null;
  invoiceCounts: { paid: number; pending: number; overdue: number };
  averageInvoiceCents: number;
  remainingCents: number;
  points: StatisticsPoint[];
  topClients: Array<{
    id: string;
    name: string;
    collectedCents: number;
    paidInvoiceCount: number;
  }>;
};

export type StatisticsIntervention = {
  id: string;
  title: string;
  profitability: ProfitabilityInput;
};

export type StatisticsPurchase = {
  totalAmountCents: number;
  supplierId: string | null;
  supplierName: string;
};

export type OperationalStatisticsResult = {
  totalCostCents: number | null;
  marginCents: number | null;
  marginPercent: number | null;
  plannedCostCents: number | null;
  plannedMarginCents: number | null;
  plannedMinutes: number;
  incompleteInterventions: number;
  workedMinutes: number;
  timeByMember: Array<{ userId: string; memberName: string; workedMinutes: number }>;
  purchasesCents: number;
  suppliers: Array<{ id: string; name: string; amountCents: number }>;
  costs: { materials: number; labor: number; travel: number; rental: number; subcontracting: number; other: number };
  interventions: Array<{ id: string; title: string; soldCents: number; costCents: number; marginCents: number; marginPercent: number | null }>;
};

function shiftDateKey(dateKey: string, input: { days?: number; months?: number }) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (input.months) date.setUTCMonth(date.getUTCMonth() + input.months);
  if (input.days) date.setUTCDate(date.getUTCDate() + input.days);
  return date.toISOString().slice(0, 10);
}

export function resolveStatisticsRange(input: {
  period?: string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
}): StatisticsRange {
  const allowed = new Set<StatisticsPeriod>(["month", "previousMonth", "year", "7d", "30d", "3m", "6m", "1y", "custom"]);
  const period = allowed.has(input.period as StatisticsPeriod)
    ? (input.period as StatisticsPeriod)
    : "month";
  const today = formatParisDateKey(input.now ?? new Date());
  let from = today;
  let to = today;

  if (period === "custom" && isDateKey(input.from ?? "") && isDateKey(input.to ?? "")) {
    from = input.from as string;
    to = input.to as string;
    if (from > to) [from, to] = [to, from];
  } else if (period === "month") from = `${today.slice(0, 8)}01`;
  else if (period === "previousMonth") {
    const [year, month] = today.split("-").map(Number);
    const firstCurrent = new Date(Date.UTC(year, month - 1, 1));
    const firstPrevious = new Date(Date.UTC(year, month - 2, 1));
    const lastPrevious = new Date(firstCurrent.getTime() - 86_400_000);
    from = firstPrevious.toISOString().slice(0, 10);
    to = lastPrevious.toISOString().slice(0, 10);
  } else if (period === "year") from = `${today.slice(0, 4)}-01-01`;
  else if (period === "7d") from = shiftDateKey(today, { days: -6 });
  else if (period === "30d") from = shiftDateKey(today, { days: -29 });
  else if (period === "3m") from = shiftDateKey(today, { months: -3, days: 1 });
  else if (period === "6m") from = shiftDateKey(today, { months: -6, days: 1 });
  else if (period === "1y") from = shiftDateKey(today, { months: -12, days: 1 });
  else if (period === "custom") {
    from = shiftDateKey(today, { days: -29 });
    to = today;
  }

  const startBounds = getParisDayBounds(from)!;
  const endBounds = getParisDayBounds(to)!;
  return { start: startBounds.start, endExclusive: endBounds.nextStart, from, to, period };
}

export function previousStatisticsRange(range: StatisticsRange): StatisticsRange {
  const duration = range.endExclusive.getTime() - range.start.getTime();
  const previousEnd = new Date(range.start);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return {
    start: previousStart,
    endExclusive: previousEnd,
    from: formatParisDateKey(previousStart),
    to: shiftDateKey(range.from, { days: -1 }),
    period: "custom",
  };
}

export function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) * 10_000) / Math.abs(previous)) / 100;
}

function inRange(value: Date | string | null | undefined, range: StatisticsRange) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= range.start.getTime() && time < range.endExclusive.getTime();
}

function bucketMode(range: StatisticsRange): "day" | "week" | "month" {
  const days = Math.ceil((range.endExclusive.getTime() - range.start.getTime()) / 86_400_000);
  if (days <= 31) return "day";
  if (days <= 130) return "week";
  return "month";
}

function bucketKey(date: Date, mode: "day" | "week" | "month") {
  const dateKey = formatParisDateKey(date);
  if (mode === "day") return dateKey;
  if (mode === "month") return dateKey.slice(0, 7);
  const utc = new Date(`${dateKey}T00:00:00Z`);
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  return utc.toISOString().slice(0, 10);
}

function pointLabel(key: string, mode: "day" | "week" | "month") {
  const date = new Date(`${mode === "month" ? `${key}-01` : key}T12:00:00Z`);
  return new Intl.DateTimeFormat("fr-FR", mode === "month"
    ? { month: "short", year: "2-digit", timeZone: "Europe/Paris" }
    : { day: "2-digit", month: "short", timeZone: "Europe/Paris" }).format(date);
}

function makePoints(range: StatisticsRange) {
  const mode = bucketMode(range);
  const points = new Map<string, StatisticsPoint>();
  let cursor = range.from;
  while (cursor <= range.to) {
    const noon = new Date(`${cursor}T12:00:00Z`);
    const key = bucketKey(noon, mode);
    if (!points.has(key)) points.set(key, { key, label: pointLabel(key, mode), billedCents: 0, collectedCents: 0 });
    cursor = shiftDateKey(cursor, { days: 1 });
  }
  return points;
}

export function buildStatistics(input: {
  range: StatisticsRange;
  invoices: StatisticsInvoice[];
  quotes: StatisticsQuote[];
  payments: StatisticsPayment[];
}): StatisticsResult {
  const issuedInvoices = input.invoices.filter(
    (invoice) => invoice.status !== "BROUILLON" && invoice.status !== "ANNULEE" && inRange(invoice.sentAt ?? invoice.createdAt, input.range),
  );
  const billedCents = issuedInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.amountCents - sumIssuedCreditsCents(invoice.creditNotes)), 0);
  const successfulPayments = input.payments.filter(
    (payment) => payment.status === "SUCCEEDED" && inRange(payment.paidAt, input.range),
  );
  const collectedCents = successfulPayments.reduce(
    (sum, payment) => sum + Math.max(0, payment.amountCents - payment.refundedCents),
    0,
  );

  const sentQuotes = input.quotes.filter((quote) => quote.sentAt && inRange(quote.sentAt, input.range));
  const accepted = sentQuotes.filter((quote) => quote.status === "ACCEPTE");
  const refused = sentQuotes.filter((quote) => quote.status === "REFUSE");
  const pendingQuotes = sentQuotes.filter((quote) => quote.status === "ENVOYE");
  const soldCents = input.quotes
    .filter((quote) => quote.status === "ACCEPTE" && inRange(quote.acceptedAt ?? quote.sentAt, input.range))
    .reduce((sum, quote) => sum + quote.amountCents, 0);
  const decidedCount = accepted.length + refused.length;
  const converted = sentQuotes.filter((quote) =>
    quote.invoices.some((invoice) => invoice.status !== "ANNULEE"),
  ).length;

  const remainingCents = issuedInvoices.reduce((sum, invoice) => {
    const credited = sumIssuedCreditsCents(invoice.creditNotes);
    return sum + computeInvoicePaymentState(invoice.amountCents, invoice.payments, credited).remainingCents;
  }, 0);

  const points = makePoints(input.range);
  for (const invoice of issuedInvoices) {
    const point = points.get(bucketKey(invoice.sentAt ?? invoice.createdAt, bucketMode(input.range)));
    if (point) point.billedCents += Math.max(0, invoice.amountCents - sumIssuedCreditsCents(invoice.creditNotes));
  }
  for (const payment of successfulPayments) {
    const point = points.get(bucketKey(new Date(payment.paidAt!), bucketMode(input.range)));
    if (point) point.collectedCents += Math.max(0, payment.amountCents - payment.refundedCents);
  }

  const clients = new Map<string, { id: string; name: string; collectedCents: number; invoiceIds: Set<string> }>();
  for (const payment of successfulPayments) {
    const entry = clients.get(payment.clientId) ?? {
      id: payment.clientId,
      name: payment.clientName || "Client",
      collectedCents: 0,
      invoiceIds: new Set<string>(),
    };
    entry.collectedCents += Math.max(0, payment.amountCents - payment.refundedCents);
    if (payment.invoiceStatus === "PAYEE") entry.invoiceIds.add(payment.invoiceId);
    clients.set(payment.clientId, entry);
  }

  return {
    soldCents,
    billedCents,
    collectedCents,
    sentQuotes: sentQuotes.length,
    acceptanceRate: decidedCount ? Math.round((accepted.length * 100) / decidedCount) : null,
    quoteCounts: { accepted: accepted.length, refused: refused.length, pending: pendingQuotes.length },
    averageQuoteCents: sentQuotes.length
      ? Math.round(sentQuotes.reduce((sum, quote) => sum + quote.amountCents, 0) / sentQuotes.length)
      : 0,
    quoteToInvoiceRate: sentQuotes.length ? Math.round((converted * 100) / sentQuotes.length) : null,
    invoiceCounts: {
      paid: issuedInvoices.filter((invoice) => invoice.status === "PAYEE").length,
      pending: issuedInvoices.filter((invoice) => invoice.status === "ENVOYEE").length,
      overdue: issuedInvoices.filter((invoice) => invoice.status === "EN_RETARD").length,
    },
    averageInvoiceCents: issuedInvoices.length ? Math.round(billedCents / issuedInvoices.length) : 0,
    remainingCents,
    points: [...points.values()],
    topClients: [...clients.values()]
      .sort((a, b) => b.collectedCents - a.collectedCents)
      .slice(0, 5)
      .map((client) => ({ ...client, paidInvoiceCount: client.invoiceIds.size })),
  };
}

export function buildOperationalStatistics(input: { interventions: StatisticsIntervention[]; purchases: StatisticsPurchase[] }): OperationalStatisticsResult {
  const computed = input.interventions.map((intervention) => ({ intervention, result: computeInterventionProfitability(intervention.profitability) }));
  const complete = computed.filter(({ result }) => result.soldRevenueCents !== null && result.totalCostCents !== null);
  const soldCents = complete.reduce((sum, entry) => sum + entry.result.soldRevenueCents!, 0);
  const completeCost = computed.filter(({ result }) => result.totalCostCents !== null);
  const totalCostCents = completeCost.length ? completeCost.reduce((sum, entry) => sum + entry.result.totalCostCents!, 0) : null;
  const marginCostCents = complete.reduce((sum, entry) => sum + entry.result.totalCostCents!, 0);
  const marginCents = complete.length ? soldCents - marginCostCents : null;
  const planned = computed.filter(({ result }) => result.soldRevenueCents !== null && result.plannedCostCents !== null);
  const memberMap = new Map<string, { userId: string; memberName: string; workedMinutes: number }>();
  for (const { result } of computed) for (const member of result.timeByMember) {
    const current = memberMap.get(member.userId) ?? { userId: member.userId, memberName: member.memberName, workedMinutes: 0 };
    current.workedMinutes += member.workedMinutes;
    memberMap.set(member.userId, current);
  }
  const suppliers = new Map<string, { id: string; name: string; amountCents: number }>();
  for (const purchase of input.purchases) {
    const id = purchase.supplierId ?? `name:${purchase.supplierName}`;
    const current = suppliers.get(id) ?? { id, name: purchase.supplierName || "Sans fournisseur", amountCents: 0 };
    current.amountCents += purchase.totalAmountCents;
    suppliers.set(id, current);
  }
  const sum = (pick: (result: ReturnType<typeof computeInterventionProfitability>) => number) => computed.reduce((total, entry) => total + pick(entry.result), 0);
  return {
    totalCostCents,
    marginCents,
    marginPercent: marginCents === null || soldCents <= 0 ? null : Math.round((marginCents * 10_000) / soldCents) / 100,
    plannedCostCents: planned.length ? planned.reduce((sum, entry) => sum + entry.result.plannedCostCents!, 0) : null,
    plannedMarginCents: planned.length ? planned.reduce((sum, entry) => sum + entry.result.plannedMarginCents!, 0) : null,
    plannedMinutes: sum((result) => result.plannedLaborMinutes),
    incompleteInterventions: computed.filter(({ result }) => result.soldRevenueCents === null || !result.totalCostComplete).length,
    workedMinutes: sum((result) => result.workedMinutes),
    timeByMember: [...memberMap.values()].sort((a, b) => b.workedMinutes - a.workedMinutes),
    purchasesCents: input.purchases.reduce((total, purchase) => total + purchase.totalAmountCents, 0),
    suppliers: [...suppliers.values()].sort((a, b) => b.amountCents - a.amountCents).slice(0, 5),
    costs: {
      materials: sum((result) => result.materialsCostCents), labor: sum((result) => result.laborCostCents),
      travel: sum((result) => result.travelCostCents), rental: sum((result) => result.rentalCostCents),
      subcontracting: sum((result) => result.subcontractingCostCents), other: sum((result) => result.otherCostCents),
    },
    interventions: complete.map(({ intervention, result }) => ({
      id: intervention.id, title: intervention.title, soldCents: result.soldRevenueCents!, costCents: result.totalCostCents!,
      marginCents: result.actualMarginCents!, marginPercent: result.actualMarginPercent,
    })).sort((a, b) => b.marginCents - a.marginCents),
  };
}
