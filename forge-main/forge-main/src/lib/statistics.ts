import { getParisDayBounds, formatParisDateKey, isDateKey } from "@/src/lib/paris-datetime";
import { computeInvoicePaymentState, type PaymentRecord } from "@/src/lib/payments";
import { sumIssuedCreditsCents, type CreditNoteAmountRecord } from "@/src/lib/credit-notes";

export type StatisticsPeriod = "7d" | "30d" | "3m" | "6m" | "1y" | "custom";

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
  payments: PaymentRecord[];
  creditNotes: CreditNoteAmountRecord[];
};

export type StatisticsQuote = {
  id: string;
  amountCents: number;
  status: string;
  sentAt: Date | null;
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
  const allowed = new Set<StatisticsPeriod>(["7d", "30d", "3m", "6m", "1y", "custom"]);
  const period = allowed.has(input.period as StatisticsPeriod)
    ? (input.period as StatisticsPeriod)
    : "30d";
  const today = formatParisDateKey(input.now ?? new Date());
  let from = today;
  let to = today;

  if (period === "custom" && isDateKey(input.from ?? "") && isDateKey(input.to ?? "")) {
    from = input.from as string;
    to = input.to as string;
    if (from > to) [from, to] = [to, from];
  } else if (period === "7d") from = shiftDateKey(today, { days: -6 });
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
    (invoice) => invoice.status !== "BROUILLON" && invoice.status !== "ANNULEE" && inRange(invoice.createdAt, input.range),
  );
  const billedCents = issuedInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
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
    const point = points.get(bucketKey(invoice.createdAt, bucketMode(input.range)));
    if (point) point.billedCents += invoice.amountCents;
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
