export const TRIAL_DURATION_DAYS = 30;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

/** Nombre de jours de sursis avant suppression d'une équipe 100 % gratuite. */
export const TEAM_GRACE_DAYS = 14;
/** Membres max d'une équipe créée par un abonné Standard (illimité pour Pro). */
export const TEAM_MEMBER_LIMIT = 5;

export const SUBSCRIPTION_STATUSES = [
  "TRIAL",
  "ACTIVE",
  "ACTIVE_PRO",
  "FREE",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

const PAID_STATUSES = new Set(["ACTIVE", "ACTIVE_PRO"]);

export function createTrialPeriod(startedAt = new Date()) {
  return {
    trialStartedAt: startedAt,
    trialEndsAt: new Date(startedAt.getTime() + TRIAL_DURATION_MS),
  };
}

export function isPaidSubscriptionActive(status: string | null | undefined) {
  return PAID_STATUSES.has((status ?? "").toUpperCase());
}

export function isProSubscription(status: string | null | undefined) {
  return (status ?? "").toUpperCase() === "ACTIVE_PRO";
}

export function evaluateSubscriptionAccess(
  subscriptionStatus: string | null | undefined,
  trialEndsAt: Date | null | undefined,
  now = new Date(),
) {
  const hasActiveSubscription = isPaidSubscriptionActive(subscriptionStatus);
  const isPro = isProSubscription(subscriptionStatus);
  const isTrialActive = Boolean(trialEndsAt && trialEndsAt > now);

  return {
    hasAccess: hasActiveSubscription || isTrialActive,
    hasActiveSubscription,
    isPro,
    isTrialActive,
    isTrialExpired: !hasActiveSubscription && !isTrialActive,
    trialEndsAt: trialEndsAt ?? null,
    daysRemaining:
      isTrialActive && trialEndsAt
        ? Math.max(
            1,
            Math.ceil(
              (trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
            ),
          )
        : 0,
  };
}

/**
 * Un compte TRIAL dont l'essai est terminé sans abonnement doit être considéré
 * comme FREE. Renvoie le statut à stocker — inchangé dans tous les autres cas
 * (on ne réécrit jamais un statut par surprise).
 */
export function resolveEffectiveStatus(
  subscriptionStatus: string | null | undefined,
  trialEndsAt: Date | null | undefined,
  now = new Date(),
): string {
  const raw = subscriptionStatus ?? "";

  if (raw.toUpperCase() === "TRIAL" && !(trialEndsAt && trialEndsAt > now)) {
    return "FREE";
  }

  return raw;
}
