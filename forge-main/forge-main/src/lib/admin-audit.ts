import { headers } from "next/headers";

import { prisma } from "@/src/lib/prisma";

export type AdminAction =
  | "USER_PASSWORD_RESET_EMAIL"
  | "USER_TEMP_PASSWORD_SET"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_DATA_EXPORTED"
  | "SUBSCRIPTION_CHANGED"
  | "STAFF_GRANTED"
  | "STAFF_ROLE_CHANGED"
  | "STAFF_REVOKED";

type RecordInput = {
  actorId: string;
  action: AdminAction;
  targetType: "User" | "StaffMember";
  targetId: string;
  summary?: string;
  metadata?: Record<string, unknown>;
};

async function getClientIp() {
  try {
    const store = await headers();
    const forwarded = store.get("x-forwarded-for");

    return forwarded?.split(",")[0]?.trim() || store.get("x-real-ip") || null;
  } catch {
    return null;
  }
}

/**
 * Écrit une entrée dans le journal d'audit admin. Toute action du back-office
 * qui lit des données sensibles ou modifie un compte doit appeler cette
 * fonction : c'est la trace d'accès licite (RGPD).
 */
export async function recordAdminAction(input: RecordInput) {
  const ipAddress = await getClientIp();

  await prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      summary: input.summary ?? null,
      metadata: input.metadata
        ? JSON.parse(JSON.stringify(input.metadata))
        : undefined,
      ipAddress,
    },
  });
}
