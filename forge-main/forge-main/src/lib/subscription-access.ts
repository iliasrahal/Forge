import { prisma } from "@/src/lib/prisma";
import { evaluateSubscriptionAccess } from "@/src/lib/subscription-policy";

export {
  createTrialPeriod,
  evaluateSubscriptionAccess,
  isPaidSubscriptionActive,
  TRIAL_DURATION_DAYS,
} from "@/src/lib/subscription-policy";

export async function getSubscriptionAccessForUser(
  userId: string,
  now = new Date(),
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
    },
  });

  return {
    ...evaluateSubscriptionAccess(
      user?.subscriptionStatus,
      user?.trialEndsAt,
      now,
    ),
    source: "user" as const,
  };
}
