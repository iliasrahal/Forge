import { createHash } from "node:crypto";

import { prisma } from "@/src/lib/prisma";
import { isProSubscription } from "@/src/lib/subscription-policy";
import { countUserTeams, teamMemberLimit } from "@/src/lib/team-access";
import {
  EXPIRED_INVITATION_MESSAGE,
  invitationEmailMatches,
  isTeamInvitationExpired,
  resolveInvitedRole,
} from "@/src/lib/team-invitation-policy";

export {
  EXPIRED_INVITATION_MESSAGE,
  getEffectiveInvitationExpiry,
  isTeamInvitationExpired,
  TEAM_INVITATION_TTL_MS,
} from "@/src/lib/team-invitation-policy";

export class TeamInvitationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "TeamInvitationError";
  }
}

export function hashTeamInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function acceptTeamInvitation({
  token,
  userId,
  userEmail,
  sessionId,
  now = new Date(),
}: {
  token: string;
  userId: string;
  userEmail: string;
  sessionId?: string;
  now?: Date;
}) {
  const invitation = await prisma.teamInvitation.findUnique({
    where: { tokenHash: hashTeamInvitationToken(token) },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (!invitation || invitation.status === "REVOKED") {
    throw new TeamInvitationError(
      "Cette invitation est invalide.",
      400,
      "INVITATION_INVALID",
    );
  }

  if (isTeamInvitationExpired(invitation, now)) {
    throw new TeamInvitationError(
      EXPIRED_INVITATION_MESSAGE,
      410,
      "INVITATION_EXPIRED",
    );
  }

  if (!invitationEmailMatches(invitation.email, userEmail)) {
    throw new TeamInvitationError(
      "Cette invitation a été envoyée à une autre adresse e-mail.",
      403,
      "INVITATION_EMAIL_MISMATCH",
    );
  }

  const [user, existingMembership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true },
    }),
    prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: invitation.organizationId,
        },
      },
      select: { id: true, role: true },
    }),
  ]);

  if (!user) {
    throw new TeamInvitationError(
      "Ce compte est introuvable.",
      404,
      "USER_NOT_FOUND",
    );
  }

  if (invitation.status === "ACCEPTED" && !existingMembership) {
    throw new TeamInvitationError(
      "Cette invitation a déjà été utilisée.",
      409,
      "INVITATION_ALREADY_USED",
    );
  }

  if (!existingMembership) {
    if (!isProSubscription(user.subscriptionStatus)) {
      const otherTeams = await countUserTeams(userId, invitation.organizationId);
      if (otherTeams >= 1) {
        throw new TeamInvitationError(
          "Tu fais déjà partie d’une équipe.",
          403,
          "TEAM_LIMIT_REACHED",
        );
      }
    }

    const owner = await prisma.organizationMember.findFirst({
      where: { organizationId: invitation.organizationId, role: "OWNER" },
      select: { user: { select: { subscriptionStatus: true } } },
    });
    const limit = teamMemberLimit(owner?.user.subscriptionStatus);

    if (Number.isFinite(limit)) {
      const memberCount = await prisma.organizationMember.count({
        where: { organizationId: invitation.organizationId },
      });
      if (memberCount >= limit) {
        throw new TeamInvitationError(
          `Cette équipe est complète (${limit} personnes maximum).`,
          403,
          "TEAM_FULL",
        );
      }
    }
  }

  const invitedRole = resolveInvitedRole(
    invitation.role,
    user.subscriptionStatus,
  );
  const adminDowngraded =
    !existingMembership && invitedRole.adminDowngraded;
  const effectiveRole = invitedRole.role;

  await prisma.$transaction(async (transaction) => {
    if (!existingMembership) {
      await transaction.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId,
            organizationId: invitation.organizationId,
          },
        },
        update: {},
        create: {
          userId,
          organizationId: invitation.organizationId,
          role: effectiveRole,
        },
      });
    }

    if (invitation.status === "PENDING") {
      await transaction.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });
    }

    if (sessionId) {
      await transaction.session.update({
        where: { id: sessionId },
        data: { activeOrganizationId: invitation.organizationId },
      });
    }
  });

  return {
    workspaceId: invitation.organizationId,
    workspaceName: invitation.organization.name,
    role: existingMembership?.role ?? effectiveRole,
    alreadyMember: Boolean(existingMembership),
    adminDowngraded,
  };
}
