import { isPaidSubscriptionActive } from "@/src/lib/subscription-policy";
import { normalizeEmail } from "@/src/lib/email-normalization";

export const TEAM_INVITATION_TTL_MS = 24 * 60 * 60 * 1000;
export const EXPIRED_INVITATION_MESSAGE =
  "Cette invitation a expiré. Demandez à l’administrateur de vous envoyer une nouvelle invitation.";

export function getEffectiveInvitationExpiry(invitation: {
  createdAt: Date;
  expiresAt: Date;
}) {
  const maximumExpiry = new Date(
    invitation.createdAt.getTime() + TEAM_INVITATION_TTL_MS,
  );

  return invitation.expiresAt < maximumExpiry
    ? invitation.expiresAt
    : maximumExpiry;
}

export function isTeamInvitationExpired(
  invitation: { createdAt: Date; expiresAt: Date },
  now = new Date(),
) {
  return getEffectiveInvitationExpiry(invitation) <= now;
}

export function invitationEmailMatches(invitedEmail: string, userEmail: string) {
  return normalizeEmail(invitedEmail) === normalizeEmail(userEmail);
}

export function resolveInvitedRole(
  requestedRole:
    | "OWNER"
    | "ADMIN"
    | "READ_ONLY"
    | "MANAGER"
    | "TECHNICIAN",
  subscriptionStatus: string | null | undefined,
) {
  const adminDowngraded =
    requestedRole === "ADMIN" &&
    !isPaidSubscriptionActive(subscriptionStatus);

  return {
    role: adminDowngraded ? ("READ_ONLY" as const) : requestedRole,
    adminDowngraded,
  };
}
