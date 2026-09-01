import { prisma } from "@/src/lib/prisma";
import {
  evaluateSubscriptionAccess,
  isProSubscription,
  TEAM_GRACE_DAYS,
  TEAM_MEMBER_LIMIT,
} from "@/src/lib/subscription-policy";

const GRACE_MS = TEAM_GRACE_DAYS * 24 * 60 * 60 * 1000;

/** Un compte a-t-il un accès en écriture (abonné ou essai en cours) ? */
function hasBillingAccess(user: {
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
}) {
  return evaluateSubscriptionAccess(
    user.subscriptionStatus,
    user.trialEndsAt,
  ).hasAccess;
}

/** Nombre d'équipes (type TEAM) auxquelles l'utilisateur appartient. */
export async function countUserTeams(userId: string, exceptOrgId?: string) {
  return prisma.organizationMember.count({
    where: {
      userId,
      organization: { type: "TEAM" },
      ...(exceptOrgId ? { organizationId: { not: exceptOrgId } } : {}),
    },
  });
}

export function teamMemberLimit(ownerStatus: string | null | undefined) {
  return isProSubscription(ownerStatus)
    ? Number.POSITIVE_INFINITY
    : TEAM_MEMBER_LIMIT;
}

/**
 * Recalcule le sursis d'une équipe :
 * - si au moins un membre a un accès facturé -> graceExpiresAt = null
 * - sinon, si pas déjà armé -> graceExpiresAt = maintenant + 14 j
 */
export async function recomputeTeamGrace(organizationId: string, now = new Date()) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, type: true, graceExpiresAt: true },
  });
  if (!org || org.type !== "TEAM") return null;

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    select: {
      user: { select: { subscriptionStatus: true, trialEndsAt: true } },
    },
  });

  const someonePays = members.some((member) => hasBillingAccess(member.user));

  if (someonePays) {
    if (org.graceExpiresAt) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { graceExpiresAt: null },
      });
    }

    return null;
  }

  if (!org.graceExpiresAt) {
    const graceExpiresAt = new Date(now.getTime() + GRACE_MS);
    await prisma.organization.update({
      where: { id: organizationId },
      data: { graceExpiresAt },
    });

    return graceExpiresAt;
  }

  return org.graceExpiresAt;
}

/**
 * Supprime les équipes dont le sursis est écoulé. Renvoie le nombre supprimé.
 * Appelé de façon opportuniste (contexte workspace) et depuis /admin.
 */
export async function cleanupExpiredTeams(now = new Date()) {
  const expired = await prisma.organization.findMany({
    where: {
      type: "TEAM",
      graceExpiresAt: { not: null, lte: now },
    },
    select: { id: true },
  });

  if (expired.length === 0) return 0;

  await prisma.organization.deleteMany({
    where: { id: { in: expired.map((org) => org.id) } },
  });

  return expired.length;
}

// Anti-emballement : au plus un balayage global toutes les 10 min par instance.
let lastSweep = 0;

export async function maybeSweepExpiredTeams(now = new Date()) {
  if (now.getTime() - lastSweep < 10 * 60 * 1000) return 0;
  lastSweep = now.getTime();

  try {
    return await cleanupExpiredTeams(now);
  } catch (error) {
    console.error("Sweep équipes échues :", error);

    return 0;
  }
}
