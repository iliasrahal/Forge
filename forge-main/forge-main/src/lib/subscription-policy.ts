export const TRIAL_DURATION_DAYS = 30;
const TRIAL_DURATION_MS =
  TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export function createTrialPeriod(startedAt = new Date()) {
  return {
    trialStartedAt: startedAt,
    trialEndsAt: new Date(startedAt.getTime() + TRIAL_DURATION_MS),
  };
}

export function isPaidSubscriptionActive(status: string | null | undefined) {
  return ["ACTIVE", "PAID"].includes((status ?? "").toUpperCase());
}

export function evaluateSubscriptionAccess(
  subscriptionStatus: string | null | undefined,
  trialEndsAt: Date | null | undefined,
  now = new Date(),
) {
  const hasActiveSubscription = isPaidSubscriptionActive(subscriptionStatus);
  const isTrialActive = Boolean(trialEndsAt && trialEndsAt > now);

  return {
    hasAccess: hasActiveSubscription || isTrialActive,
    hasActiveSubscription,
    isTrialActive,
    isTrialExpired: !hasActiveSubscription && !isTrialActive,
    trialEndsAt: trialEndsAt ?? null,
    daysRemaining:
      isTrialActive && trialEndsAt
        ? Math.max(
            1,
            Math.ceil(
              (trialEndsAt.getTime() - now.getTime()) /
                (24 * 60 * 60 * 1000),
            ),
          )
        : 0,
  };
}
