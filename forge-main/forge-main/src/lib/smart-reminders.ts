import { computeInvoicePaymentState } from "@/src/lib/payments";
import { getQuoteReminderState } from "@/src/lib/quote-reminders";
import { getQuoteClientName, getQuotePath } from "@/src/lib/quote-routes";
import { formatParisDateKey } from "@/src/lib/paris-datetime";

export const DRAFT_DOCUMENT_REMINDER_DELAY_HOURS = 24;
export const INTERVENTION_INVOICE_REMINDER_DELAY_HOURS = 24;
export const INVOICE_PAYMENT_FALLBACK_DELAY_DAYS = 7;
export const MAX_HOME_REMINDERS = 5;

const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;

type ClientSummary = {
  type: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
} | null;

export type SmartReminder = {
  id: string;
  kind:
    | "QUOTE_DRAFT"
    | "QUOTE_WAITING"
    | "INVOICE_DRAFT"
    | "INVOICE_UNPAID"
    | "INTERVENTION_UNBILLED";
  title: string;
  detail: string;
  actionLabel: string;
  href: string;
  interventionId?: string;
  priority: number;
  since: string;
};

type QuoteInput = {
  id: string;
  clientId: string | null;
  client: ClientSummary;
  status: "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";
  createdAt: Date;
  sentAt: Date | null;
  reminders: Array<{ sentAt: Date }>;
};

type InvoiceInput = {
  id: string;
  reference: string;
  amountCents: number;
  status: "BROUILLON" | "ENVOYEE" | "PAYEE" | "EN_RETARD" | "ANNULEE";
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  client: ClientSummary;
  payments: Array<{
    status: string;
    amountCents: number;
    feeCents: number;
    refundedCents: number;
    paidAt: Date | null;
  }>;
};

type InterventionInput = {
  id: string;
  title: string;
  status: string;
  finishedAt: Date | null;
  updatedAt: Date;
  client: ClientSummary;
  invoiceCount: number;
};

function hasElapsed(from: Date, durationMs: number, now: Date) {
  return now.getTime() - from.getTime() >= durationMs;
}

function clientLabel(client: ClientSummary) {
  return client ? getQuoteClientName(client) : null;
}

export function buildSmartReminders(input: {
  quotes: QuoteInput[];
  invoices: InvoiceInput[];
  interventions: InterventionInput[];
  now?: Date;
}): SmartReminder[] {
  const now = input.now ?? new Date();
  const reminders: SmartReminder[] = [];

  for (const quote of input.quotes) {
    const name = clientLabel(quote.client);

    if (
      quote.status === "BROUILLON" &&
      !quote.sentAt &&
      hasElapsed(quote.createdAt, DRAFT_DOCUMENT_REMINDER_DELAY_HOURS * HOUR_MS, now)
    ) {
      reminders.push({
        id: `quote-draft-${quote.id}`,
        kind: "QUOTE_DRAFT",
        title: name ? `Devis ${name}` : "Devis sans client",
        detail: name
          ? "Prêt mais pas encore envoyé"
          : "Ce devis est prêt mais aucun client n’est encore associé.",
        actionLabel: name ? "Envoyer le devis" : "Ouvrir le devis",
        href: getQuotePath(quote),
        priority: 30,
        since: quote.createdAt.toISOString(),
      });
      continue;
    }

    const state = getQuoteReminderState({
      status: quote.status,
      sentAt: quote.sentAt,
      reminders: quote.reminders,
      now,
    });
    if (state.eligible && quote.client) {
      reminders.push({
        id: `quote-waiting-${quote.id}`,
        kind: "QUOTE_WAITING",
        title: `Devis ${name ?? "client"}`,
        detail: `Sans réponse depuis ${state.daysSinceActivity ?? 0} jours`,
        actionLabel: "Relancer",
        href: getQuotePath(quote),
        priority: 50,
        since: (quote.sentAt ?? quote.createdAt).toISOString(),
      });
    }
  }

  for (const invoice of input.invoices) {
    const name = clientLabel(invoice.client) ?? "client";
    if (
      invoice.status === "BROUILLON" &&
      hasElapsed(invoice.createdAt, DRAFT_DOCUMENT_REMINDER_DELAY_HOURS * HOUR_MS, now)
    ) {
      reminders.push({
        id: `invoice-draft-${invoice.id}`,
        kind: "INVOICE_DRAFT",
        title: `Facture ${name}`,
        detail: "Prête mais pas encore envoyée",
        actionLabel: "Envoyer la facture",
        href: `/invoices/${invoice.id}`,
        priority: 40,
        since: invoice.createdAt.toISOString(),
      });
      continue;
    }

    if (invoice.status !== "ENVOYEE" && invoice.status !== "EN_RETARD") continue;
    const payment = computeInvoicePaymentState(invoice.amountCents, invoice.payments);
    if (payment.remainingCents <= 0) continue;

    const overdue = invoice.dueDate
      ? formatParisDateKey(invoice.dueDate) < formatParisDateKey(now)
      : hasElapsed(invoice.updatedAt, INVOICE_PAYMENT_FALLBACK_DELAY_DAYS * DAY_MS, now);
    if (!overdue) continue;

    reminders.push({
      id: `invoice-unpaid-${invoice.id}`,
      kind: "INVOICE_UNPAID",
      title: `Facture ${invoice.reference}`,
      detail: `Toujours en attente de paiement · ${name}`,
      actionLabel: "Ouvrir la facture",
      href: `/invoices/${invoice.id}`,
      priority: invoice.status === "EN_RETARD" ? 100 : 70,
      since: (invoice.dueDate ?? invoice.updatedAt).toISOString(),
    });
  }

  for (const intervention of input.interventions) {
    const completedAt = intervention.finishedAt ?? intervention.updatedAt;
    if (
      intervention.status !== "TERMINEE" ||
      intervention.invoiceCount > 0 ||
      !hasElapsed(completedAt, INTERVENTION_INVOICE_REMINDER_DELAY_HOURS * HOUR_MS, now)
    ) continue;

    const hasClient = Boolean(intervention.client);
    reminders.push({
      id: `intervention-unbilled-${intervention.id}`,
      kind: "INTERVENTION_UNBILLED",
      title: `Intervention ${clientLabel(intervention.client) ?? intervention.title}`,
      detail: hasClient
        ? "Terminée mais pas encore facturée"
        : "Terminée mais aucun client n’est associé",
      actionLabel: hasClient ? "Créer la facture" : "Ouvrir l’intervention",
      href: `/interventions/${intervention.id}`,
      interventionId: hasClient ? intervention.id : undefined,
      priority: 60,
      since: completedAt.toISOString(),
    });
  }

  return reminders.sort(
    (first, second) =>
      second.priority - first.priority ||
      first.since.localeCompare(second.since),
  ).slice(0, MAX_HOME_REMINDERS);
}
