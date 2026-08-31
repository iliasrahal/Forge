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
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (membership) {
    return {
      ...evaluateSubscriptionAccess(
        membership.organization.subscriptionStatus,
        membership.organization.trialEndsAt,
        now,
      ),
      source: "organization" as const,
      organizationId: membership.organizationId,
      organizationName: membership.organization.name,
    };
  }

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
    organizationId: null,
    organizationName: null,
  };
}
