import { evaluateSubscriptionAccess } from "@/src/lib/subscription-policy";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  return dateTimeFmt.format(new Date(value));
}

export function userDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return full || user.companyName || "—";
}

export function formatAmount(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function subscriptionSummary(
  user: {
    subscriptionStatus: string | null;
    trialEndsAt: Date | null;
  },
  now = new Date(),
) {
  const access = evaluateSubscriptionAccess(
    user.subscriptionStatus,
    user.trialEndsAt,
    now,
  );

  if (access.hasActiveSubscription) {
    return { label: "Abonné", tone: "green" as const };
  }

  if (access.isTrialActive) {
    return {
      label: `Essai · ${access.daysRemaining} j`,
      tone: "blue" as const,
    };
  }

  return { label: "Essai expiré", tone: "red" as const };
}

export const SUBSCRIPTION_STATUSES = [
  "TRIAL",
  "ACTIVE",
  "PAID",
  "ORGANIZATION",
  "CANCELED",
  "EXPIRED",
] as const;
