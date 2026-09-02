export const FIRST_QUOTE_REMINDER_DELAY_DAYS = 3;
export const SECOND_QUOTE_REMINDER_DELAY_DAYS = 7;
export const QUOTE_REMINDER_COOLDOWN_HOURS = 24;
export const MAX_AUTOMATIC_QUOTE_REMINDERS = 2;

const DAY_MS = 24 * 60 * 60 * 1_000;

type QuoteReminderStatus = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";

export type QuoteReminderState = {
  eligible: boolean;
  level: 1 | 2 | null;
  daysSinceActivity: number | null;
  nextEligibleAt: Date | null;
  reason: "status" | "missing-sent-at" | "too-early" | "complete" | null;
};

export function getQuoteReminderState(input: {
  status: QuoteReminderStatus;
  sentAt: Date | null;
  reminders: Array<{ sentAt: Date }>;
  now?: Date;
}): QuoteReminderState {
  const now = input.now ?? new Date();
  if (input.status !== "ENVOYE") {
    return { eligible: false, level: null, daysSinceActivity: null, nextEligibleAt: null, reason: "status" };
  }
  if (!input.sentAt) {
    return { eligible: false, level: null, daysSinceActivity: null, nextEligibleAt: null, reason: "missing-sent-at" };
  }
  if (input.reminders.length >= MAX_AUTOMATIC_QUOTE_REMINDERS) {
    return { eligible: false, level: null, daysSinceActivity: null, nextEligibleAt: null, reason: "complete" };
  }

  const reminders = [...input.reminders].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  const level = reminders.length === 0 ? 1 : 2;
  const lastActivity = reminders[0] && reminders[0].sentAt > input.sentAt
    ? reminders[0].sentAt
    : input.sentAt;
  const delayDays = level === 1 ? FIRST_QUOTE_REMINDER_DELAY_DAYS : SECOND_QUOTE_REMINDER_DELAY_DAYS;
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

export function getManualReminderLevel(reminderCount: number): 1 | 2 {
  return reminderCount < 1 ? 1 : 2;
}

export function isReminderCoolingDown(lastReminderAt: Date | null, now = new Date()) {
  return Boolean(lastReminderAt && now.getTime() - lastReminderAt.getTime() < QUOTE_REMINDER_COOLDOWN_HOURS * 60 * 60 * 1_000);
}

export function buildStandardReminderMessage(input: {
  level: 1 | 2;
  clientName: string;
  reference: string;
  sentAt: Date | null;
  artisanSignature: string;
}) {
  const sentDate = input.sentAt
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(input.sentAt)
    : null;
  const subject = sentDate
    ? `le devis ${input.reference} envoyé le ${sentDate}`
    : `le devis ${input.reference}`;
  const body = input.level === 1
    ? `Je me permets de revenir vers vous concernant ${subject}.\n\nN’hésitez pas à me contacter si vous avez une question.`
    : `Je reviens vers vous concernant ${subject}.\n\nJe reste disponible si vous souhaitez échanger sur celui-ci ou si vous avez besoin d’une précision.`;
  return `Bonjour ${input.clientName},\n\n${body}\n\nBien cordialement,\n\n${input.artisanSignature}`;
}

export function validateReminderMessage(value: unknown) {
  if (typeof value !== "string") return { value: null, error: "Le message est obligatoire." };
  const message = value.trim();
  if (message.length < 20) return { value: null, error: "Le message est trop court." };
  if (message.length > 5_000) return { value: null, error: "Le message est trop long." };
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message)) {
    return { value: null, error: "Le message contient des caractères invalides." };
  }
  return { value: message, error: null };
}
