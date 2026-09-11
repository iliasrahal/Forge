export const FIRST_INVOICE_REMINDER_DELAY_DAYS = 7;
export const SECOND_INVOICE_REMINDER_DELAY_DAYS = 15;
export const THIRD_INVOICE_REMINDER_DELAY_DAYS = 30;
export const INVOICE_REMINDER_COOLDOWN_HOURS = 24;
export const MAX_AUTOMATIC_INVOICE_REMINDERS = 3;

const DAY_MS = 24 * 60 * 60 * 1_000;

type InvoiceReminderStatus = "BROUILLON" | "ENVOYEE" | "PAYEE" | "EN_RETARD" | "ANNULEE";

export type InvoiceReminderState = {
  eligible: boolean;
  level: 1 | 2 | 3 | null;
  daysSinceActivity: number | null;
  nextEligibleAt: Date | null;
  reason: "status" | "missing-base-date" | "too-early" | "complete" | null;
};

export function getInvoiceReminderState(input: {
  status: InvoiceReminderStatus;
  dueDate: Date | null;
  sentAt: Date | null;
  createdAt: Date | null;
  reminders: Array<{ sentAt: Date }>;
  now?: Date;
  delay1Days?: number;
  delay2Days?: number;
  delay3Days?: number;
}): InvoiceReminderState {
  const now = input.now ?? new Date();
  if (input.status !== "ENVOYEE" && input.status !== "EN_RETARD") {
    return { eligible: false, level: null, daysSinceActivity: null, nextEligibleAt: null, reason: "status" };
  }
  const baseDate = input.dueDate ?? input.sentAt ?? input.createdAt;
  if (!baseDate) {
    return { eligible: false, level: null, daysSinceActivity: null, nextEligibleAt: null, reason: "missing-base-date" };
  }
  if (input.reminders.length >= MAX_AUTOMATIC_INVOICE_REMINDERS) {
    return { eligible: false, level: null, daysSinceActivity: null, nextEligibleAt: null, reason: "complete" };
  }

  const reminders = [...input.reminders].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  const level = (reminders.length === 0 ? 1 : reminders.length === 1 ? 2 : 3) as 1 | 2 | 3;
  const lastActivity = reminders[0] && reminders[0].sentAt > baseDate
    ? reminders[0].sentAt
    : baseDate;
  const delay1Days = input.delay1Days ?? FIRST_INVOICE_REMINDER_DELAY_DAYS;
  const delay2Days = input.delay2Days ?? SECOND_INVOICE_REMINDER_DELAY_DAYS;
  const delay3Days = input.delay3Days ?? THIRD_INVOICE_REMINDER_DELAY_DAYS;
  const delayDays = level === 1 ? delay1Days : level === 2 ? delay2Days : delay3Days;
  const nextEligibleAt = new Date(lastActivity.getTime() + delayDays * DAY_MS);
  const daysSinceActivity = Math.max(0, Math.floor((now.getTime() - lastActivity.getTime()) / DAY_MS));
  return {
    eligible: now >= nextEligibleAt,
    level,
    daysSinceActivity,
    nextEligibleAt,
    reason: now >= nextEligibleAt ? null : "too-early",
  };
}

export function getManualInvoiceReminderLevel(reminderCount: number): 1 | 2 | 3 {
  return reminderCount < 1 ? 1 : reminderCount < 2 ? 2 : 3;
}

export function isInvoiceReminderCoolingDown(lastReminderAt: Date | null, now = new Date()) {
  return Boolean(lastReminderAt && now.getTime() - lastReminderAt.getTime() < INVOICE_REMINDER_COOLDOWN_HOURS * 60 * 60 * 1_000);
}

export function buildStandardInvoiceReminderMessage(input: {
  level: 1 | 2 | 3;
  clientName: string;
  reference: string;
  dueDate: Date | null;
  remainingCents: number;
  artisanSignature: string;
}) {
  const dueDateText = input.dueDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(input.dueDate)
    : null;
  const amountText = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(input.remainingCents / 100);
  const subject = dueDateText
    ? `la facture ${input.reference}, échue le ${dueDateText}`
    : `la facture ${input.reference}`;
  const body = input.level === 1
    ? `Je me permets de revenir vers vous concernant ${subject}, d’un montant restant dû de ${amountText}.\n\nN’hésitez pas à me contacter si vous avez une question.`
    : input.level === 2
      ? `Sauf erreur de ma part, ${subject} reste impayée à ce jour, pour un montant de ${amountText}.\n\nJe reste disponible si vous souhaitez échanger à ce sujet.`
      : `Je reviens vers vous une dernière fois concernant ${subject}, toujours en attente de règlement (${amountText}).\n\nMerci de bien vouloir régulariser cette situation dans les meilleurs délais.`;
  return `Bonjour ${input.clientName},\n\n${body}\n\nBien cordialement,\n\n${input.artisanSignature}`;
}

export function validateInvoiceReminderMessage(value: unknown) {
  if (typeof value !== "string") return { value: null, error: "Le message est obligatoire." };
  const message = value.trim();
  if (message.length < 20) return { value: null, error: "Le message est trop court." };
  if (message.length > 5_000) return { value: null, error: "Le message est trop long." };
  const forbidden = [0,1,2,3,4,5,6,7,8,11,12,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127];
  if (Array.from(message).some((ch) => forbidden.includes(ch.codePointAt(0) || -1))) {
    return { value: null, error: "Le message contient des caractères invalides." };
  }
  return { value: message, error: null };
}
