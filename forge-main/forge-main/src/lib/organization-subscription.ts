import { prisma } from "@/src/lib/prisma";
import { evaluateSubscriptionAccess } from "@/src/lib/subscription-policy";

/**
 * Accès payant d'une organisation, résolu depuis l'abonnement de son
 * propriétaire — l'abonnement vit sur `User`, jamais sur `Organization`
 * (les colonnes de compatibilité sur `Organization` ne sont jamais tenues à
 * jour). À utiliser hors contexte de session (ex. route publique) : le
 * middleware `requireWorkspaceContext` reste la référence côté app connectée.
 */
export async function getOrganizationSubscriptionAccess(
  organizationId: string,
  now = new Date(),
) {
  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId, role: "OWNER" },
    select: {
      user: { select: { subscriptionStatus: true, trialEndsAt: true } },
    },
  });

  return evaluateSubscriptionAccess(
    owner?.user.subscriptionStatus,
    owner?.user.trialEndsAt,
    now,
  );
}
