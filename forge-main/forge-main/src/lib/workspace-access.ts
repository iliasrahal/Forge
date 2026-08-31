import { cookies } from "next/headers";

import { prisma } from "@/src/lib/prisma";
import { evaluateSubscriptionAccess } from "@/src/lib/subscription-policy";

export type EffectiveWorkspaceRole =
  | "OWNER"
  | "ADMIN"
  | "READ_ONLY"
  | "LEGACY_TECHNICIAN";
export type WorkspacePermission =
  | "read"
  | "write"
  | "useForge"
  | "manageTeam";

export class WorkspaceAccessError extends Error {
  status: number;
  code: "AUTH_REQUIRED" | "WORKSPACE_REQUIRED" | "READ_ONLY" | "SUBSCRIPTION_REQUIRED" | "FORBIDDEN";

  constructor(
    message: string,
    status = 403,
    code: WorkspaceAccessError["code"] = "FORBIDDEN",
  ) {
    super(message);
    this.name = "WorkspaceAccessError";
    this.status = status;
    this.code = code;
  }
}

function normalizeRole(role: string): EffectiveWorkspaceRole {
  if (role === "OWNER") return "OWNER";
  if (role === "ADMIN" || role === "MANAGER") return "ADMIN";
  // Aucun TECHNICIAN historique n'est remappé sans audit de la base réelle.
  if (role === "TECHNICIAN") return "LEGACY_TECHNICIAN";
  return "READ_ONLY";
}

function getPermissions(
  role: EffectiveWorkspaceRole,
  hasBillingAccess: boolean,
) {
  const roleAllowsWrite =
    role === "OWNER" || role === "ADMIN" || role === "LEGACY_TECHNICIAN";
  const hasFullAccess = roleAllowsWrite && hasBillingAccess;

  return {
    canRead: true,
    canWrite: hasFullAccess,
    canUseForge: hasFullAccess,
    canManageTeam: role === "OWNER" && hasBillingAccess,
  };
}

export async function ensurePersonalWorkspaceForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      subscriptionStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
    },
  });

  if (!user) {
    throw new WorkspaceAccessError("Ce compte est introuvable.", 404);
  }

  const workspace = await prisma.organization.upsert({
    where: { personalOwnerId: user.id },
    update: {},
    create: {
      name: `${user.firstName} — Personnel`,
      type: "PERSONAL",
      personalOwnerId: user.id,
      subscriptionStatus: user.subscriptionStatus,
      trialStartedAt: user.trialStartedAt,
      trialEndsAt: user.trialEndsAt,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: workspace.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      userId: user.id,
      organizationId: workspace.id,
      role: "OWNER",
    },
  });

  return workspace;
}

export async function getCurrentWorkspaceContext(now = new Date()) {
  const token = (await cookies()).get("forgeSession")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: true,
      activeOrganization: true,
    },
  });

  if (!session || session.expiresAt <= now) return null;

  let membership = session.activeOrganizationId
    ? await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: session.userId,
            organizationId: session.activeOrganizationId,
          },
        },
        include: { organization: true },
      })
    : null;

  if (!membership) {
    membership = await prisma.organizationMember.findFirst({
      where: { userId: session.userId },
      include: { organization: true },
      orderBy: [{ organization: { type: "asc" } }, { createdAt: "asc" }],
    });

    if (membership) {
      await prisma.session.update({
        where: { id: session.id },
        data: { activeOrganizationId: membership.organizationId },
      });
    }
  }

  if (!membership) {
    throw new WorkspaceAccessError(
      "Aucun espace de travail n’est associé à ce compte.",
      409,
      "WORKSPACE_REQUIRED",
    );
  }

  const subscription = evaluateSubscriptionAccess(
    session.user.subscriptionStatus,
    session.user.trialEndsAt,
    now,
  );
  const role = normalizeRole(membership.role);

  return {
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
    },
    user: session.user,
    workspace: membership.organization,
    membership: {
      id: membership.id,
      role,
      storedRole: membership.role,
    },
    subscription,
    permissions: getPermissions(role, subscription.hasAccess),
  };
}

export async function requireWorkspaceContext(
  permission: WorkspacePermission = "read",
) {
  const context = await getCurrentWorkspaceContext();

  if (!context) {
    throw new WorkspaceAccessError("Tu dois être connecté.", 401, "AUTH_REQUIRED");
  }

  const allowed =
    permission === "read"
      ? context.permissions.canRead
      : permission === "write"
        ? context.permissions.canWrite
        : permission === "useForge"
          ? context.permissions.canUseForge
          : context.permissions.canManageTeam;

  if (!allowed) {
    const roleAllowsWrite =
      context.membership.role === "OWNER" ||
      context.membership.role === "ADMIN" ||
      context.membership.role === "LEGACY_TECHNICIAN";
    const subscriptionRequired = roleAllowsWrite && !context.subscription.hasAccess;
    throw new WorkspaceAccessError(
      permission === "manageTeam" && context.membership.role !== "OWNER"
        ? "Tu n’as pas accès à la gestion de cette équipe."
        : subscriptionRequired
          ? "Cette fonctionnalité nécessite un abonnement Forge."
          : "Cet espace est disponible en lecture seule.",
      403,
      subscriptionRequired ? "SUBSCRIPTION_REQUIRED" : "READ_ONLY",
    );
  }

  return context;
}

export function getWorkspaceErrorResponse(error: unknown) {
  if (error instanceof WorkspaceAccessError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        code: error.code,
        subscriptionRequired: error.code === "SUBSCRIPTION_REQUIRED",
      },
    };
  }

  return null;
}
