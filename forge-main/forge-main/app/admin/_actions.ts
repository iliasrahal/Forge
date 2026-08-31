"use server";

import { createHash, randomBytes } from "node:crypto";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

import {
  assertStaff,
  StaffAccessError,
} from "@/src/lib/admin-auth";
import { recordAdminAction } from "@/src/lib/admin-audit";
import { sendPasswordResetEmail } from "@/src/lib/email";
import { normalizePhone } from "@/src/lib/phone";
import { prisma } from "@/src/lib/prisma";
import { cleanupExpiredTeams } from "@/src/lib/team-access";
import type { StaffRole } from "@/src/generated/prisma/client";

type ActionResult =
  | {
      ok: true;
      tempPassword?: string;
      filename?: string;
      json?: string;
      deletedCount?: number;
    }
  | { ok: false; error: string };

function appUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://myforge.online"
  ).replace(/\/$/, "");
}

function fail(error: string): ActionResult {
  return { ok: false, error };
}

async function withStaff(
  minRole: StaffRole,
  run: (actorId: string) => Promise<ActionResult>,
): Promise<ActionResult> {
  try {
    const { user } = await assertStaff(minRole);

    return await run(user.id);
  } catch (error) {
    if (error instanceof StaffAccessError) {
      return { ok: false, error: error.message };
    }

    console.error("Admin action error:", error);

    return { ok: false, error: "Action impossible pour le moment." };
  }
}

/* ------------------------------------------------------------------ */
/* Mot de passe                                                        */
/* ------------------------------------------------------------------ */

export async function sendUserPasswordResetEmail(
  userId: string,
): Promise<ActionResult> {
  return withStaff("ADMIN", async (actorId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail("Utilisateur introuvable.");

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        userId: user.id,
      },
    });

    await sendPasswordResetEmail(
      user.email,
      user.firstName,
      `${appUrl()}/reset-password?token=${rawToken}`,
    );

    await recordAdminAction({
      actorId,
      action: "USER_PASSWORD_RESET_EMAIL",
      targetType: "User",
      targetId: user.id,
      summary: `Lien de réinitialisation envoyé à ${user.email}`,
    });

    return { ok: true };
  });
}

export async function setUserTempPassword(
  userId: string,
): Promise<ActionResult> {
  return withStaff("ADMIN", async (actorId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail("Utilisateur introuvable.");

    // 12 caractères base64url, sans ambiguïté visuelle excessive.
    const tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await hash(tempPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: true },
      }),
      // On coupe toutes les sessions actives du compte.
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    ]);

    await recordAdminAction({
      actorId,
      action: "USER_TEMP_PASSWORD_SET",
      targetType: "User",
      targetId: user.id,
      summary: `Mot de passe temporaire attribué à ${user.email}`,
    });

    return { ok: true, tempPassword };
  });
}

/* ------------------------------------------------------------------ */
/* Édition du compte                                                   */
/* ------------------------------------------------------------------ */

export async function updateUser(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  return withStaff("ADMIN", async (actorId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail("Utilisateur introuvable.");

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const companyName = String(formData.get("companyName") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const phoneInput = String(formData.get("phone") ?? "").trim();
    const phone = phoneInput ? normalizePhone(phoneInput) : "";

    if (!firstName) return fail("Le prénom est obligatoire.");
    if (!email.includes("@")) return fail("L'e-mail est invalide.");
    if (!phone) return fail("Le téléphone est obligatoire.");

    const clash = await prisma.user.findFirst({
      where: {
        id: { not: user.id },
        OR: [{ email }, { phone }],
      },
      select: { email: true, phone: true },
    });

    if (clash) {
      return fail(
        clash.email === email
          ? "Cet e-mail est déjà utilisé par un autre compte."
          : "Ce téléphone est déjà utilisé par un autre compte.",
      );
    }

    const before = {
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      email: user.email,
      phone: user.phone,
    };
    const after = {
      firstName,
      lastName: lastName || null,
      companyName: companyName || null,
      email,
      phone,
    };

    await prisma.user.update({ where: { id: user.id }, data: after });

    await recordAdminAction({
      actorId,
      action: "USER_UPDATED",
      targetType: "User",
      targetId: user.id,
      summary: `Fiche de ${email} modifiée`,
      metadata: { before, after },
    });

    revalidatePath(`/admin/users/${user.id}`);

    return { ok: true };
  });
}

export async function setUserSubscription(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  return withStaff("ADMIN", async (actorId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail("Utilisateur introuvable.");

    const status = String(formData.get("subscriptionStatus") ?? "").trim();
    const trialEndsRaw = String(formData.get("trialEndsAt") ?? "").trim();

    if (!status) return fail("Statut manquant.");

    let trialEndsAt: Date | null = user.trialEndsAt;
    if (trialEndsRaw) {
      const parsed = new Date(trialEndsRaw);
      if (Number.isNaN(parsed.getTime())) return fail("Date d'essai invalide.");
      trialEndsAt = parsed;
    }

    const before = {
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: status, trialEndsAt },
    });

    await recordAdminAction({
      actorId,
      action: "SUBSCRIPTION_CHANGED",
      targetType: "User",
      targetId: user.id,
      summary: `Abonnement de ${user.email} : ${before.subscriptionStatus} → ${status}`,
      metadata: { before, after: { subscriptionStatus: status, trialEndsAt } },
    });

    revalidatePath(`/admin/users/${user.id}`);

    return { ok: true };
  });
}

/* ------------------------------------------------------------------ */
/* Export & suppression                                                */
/* ------------------------------------------------------------------ */

export async function exportUserData(
  userId: string,
): Promise<ActionResult> {
  return withStaff("ADMIN", async (actorId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        clients: { include: { interventions: true, quotes: true, invoices: true } },
        memberships: { include: { organization: true } },
      },
    });
    if (!user) return fail("Utilisateur introuvable.");

    const { passwordHash: _omit, ...safeUser } = user;
    void _omit;

    await recordAdminAction({
      actorId,
      action: "USER_DATA_EXPORTED",
      targetType: "User",
      targetId: user.id,
      summary: `Export des données de ${user.email}`,
    });

    return {
      ok: true,
      filename: `forge-export-${user.email}-${Date.now()}.json`,
      json: JSON.stringify(safeUser, null, 2),
    };
  });
}

export async function deleteUserAccount(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  return withStaff("SUPER_ADMIN", async (actorId) => {
    if (actorId === userId) {
      return fail("Tu ne peux pas supprimer ton propre compte ici.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail("Utilisateur introuvable.");

    const confirmation = String(formData.get("confirmEmail") ?? "")
      .trim()
      .toLowerCase();
    if (confirmation !== user.email.toLowerCase()) {
      return fail("L'e-mail de confirmation ne correspond pas.");
    }

    // On journalise AVANT la suppression : la trace doit survivre au compte.
    await recordAdminAction({
      actorId,
      action: "USER_DELETED",
      targetType: "User",
      targetId: user.id,
      summary: `Compte ${user.email} supprimé`,
      metadata: {
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    revalidatePath("/admin/users");

    return { ok: true };
  });
}

/* ------------------------------------------------------------------ */
/* Gestion du staff (SUPER_ADMIN)                                      */
/* ------------------------------------------------------------------ */

const STAFF_ROLES: StaffRole[] = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];

export async function grantStaff(formData: FormData): Promise<ActionResult> {
  return withStaff("SUPER_ADMIN", async (actorId) => {
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const role = String(formData.get("role") ?? "").trim() as StaffRole;

    if (!STAFF_ROLES.includes(role)) return fail("Rôle invalide.");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail(`Aucun compte avec l'e-mail « ${email} ».`);

    await prisma.staffMember.upsert({
      where: { userId: user.id },
      update: { role },
      create: { userId: user.id, role },
    });

    await recordAdminAction({
      actorId,
      action: "STAFF_GRANTED",
      targetType: "StaffMember",
      targetId: user.id,
      summary: `${email} → staff ${role}`,
    });

    revalidatePath("/admin/staff");

    return { ok: true };
  });
}

export async function changeStaffRole(
  userId: string,
  role: string,
): Promise<ActionResult> {
  return withStaff("SUPER_ADMIN", async (actorId) => {
    const nextRole = role as StaffRole;
    if (!STAFF_ROLES.includes(nextRole)) return fail("Rôle invalide.");

    const member = await prisma.staffMember.findUnique({ where: { userId } });
    if (!member) return fail("Ce compte n'est pas membre du staff.");

    if (member.userId === actorId && nextRole !== "SUPER_ADMIN") {
      return fail("Tu ne peux pas réduire ton propre rôle.");
    }

    await prisma.staffMember.update({
      where: { userId },
      data: { role: nextRole },
    });

    await recordAdminAction({
      actorId,
      action: "STAFF_ROLE_CHANGED",
      targetType: "StaffMember",
      targetId: userId,
      summary: `Rôle staff : ${member.role} → ${nextRole}`,
    });

    revalidatePath("/admin/staff");

    return { ok: true };
  });
}

/* ------------------------------------------------------------------ */
/* Maintenance                                                         */
/* ------------------------------------------------------------------ */

export async function runTeamCleanup(): Promise<ActionResult> {
  return withStaff("ADMIN", async (actorId) => {
    const deletedCount = await cleanupExpiredTeams();

    if (deletedCount > 0) {
      await recordAdminAction({
        actorId,
        action: "TEAMS_CLEANED",
        targetType: "System",
        targetId: "team-cleanup",
        summary: `Nettoyage : ${deletedCount} équipe(s) supprimée(s) (sursis écoulé)`,
      });
    }

    return { ok: true, deletedCount };
  });
}

export async function deleteTeam(
  organizationId: string,
  formData: FormData,
): Promise<ActionResult> {
  return withStaff("SUPER_ADMIN", async (actorId) => {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, type: true, _count: { select: { members: true } } },
    });
    if (!org) return fail("Équipe introuvable.");
    if (org.type !== "TEAM") {
      return fail("Un espace personnel ne peut pas être supprimé ici.");
    }

    const confirmation = String(formData.get("confirmName") ?? "").trim();
    if (confirmation !== org.name) {
      return fail("Le nom de l’équipe ne correspond pas.");
    }

    await recordAdminAction({
      actorId,
      action: "TEAM_DELETED",
      targetType: "Organization",
      targetId: org.id,
      summary: `Équipe « ${org.name} » supprimée (${org._count.members} membre(s))`,
    });

    await prisma.organization.delete({ where: { id: org.id } });

    revalidatePath("/admin/teams");

    return { ok: true };
  });
}

export async function revokeStaff(userId: string): Promise<ActionResult> {
  return withStaff("SUPER_ADMIN", async (actorId) => {
    if (userId === actorId) {
      return fail("Tu ne peux pas retirer ton propre accès staff.");
    }

    const member = await prisma.staffMember.findUnique({ where: { userId } });
    if (!member) return fail("Ce compte n'est pas membre du staff.");

    await prisma.staffMember.delete({ where: { userId } });

    await recordAdminAction({
      actorId,
      action: "STAFF_REVOKED",
      targetType: "StaffMember",
      targetId: userId,
      summary: "Accès staff retiré",
    });

    revalidatePath("/admin/staff");

    return { ok: true };
  });
}

/**
 * Nomme, change ou retire le rôle staff d'un compte depuis sa fiche.
 * `role` : "SUPPORT" | "ADMIN" | "SUPER_ADMIN" | "NONE" (retire l'accès).
 */
export async function setUserStaffRole(
  userId: string,
  role: string,
): Promise<ActionResult> {
  return withStaff("SUPER_ADMIN", async (actorId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) return fail("Utilisateur introuvable.");

    const existing = await prisma.staffMember.findUnique({
      where: { userId: user.id },
    });

    if (role === "NONE") {
      if (user.id === actorId) {
        return fail("Tu ne peux pas retirer ton propre accès staff.");
      }
      if (!existing) return fail("Ce compte n'est pas membre du staff.");

      await prisma.staffMember.delete({ where: { userId: user.id } });
      await recordAdminAction({
        actorId,
        action: "STAFF_REVOKED",
        targetType: "StaffMember",
        targetId: user.id,
        summary: `Accès staff retiré pour ${user.email}`,
      });
    } else {
      const nextRole = role as StaffRole;
      if (!STAFF_ROLES.includes(nextRole)) return fail("Rôle invalide.");

      if (
        user.id === actorId &&
        existing &&
        nextRole !== "SUPER_ADMIN"
      ) {
        return fail("Tu ne peux pas réduire ton propre rôle.");
      }

      await prisma.staffMember.upsert({
        where: { userId: user.id },
        update: { role: nextRole },
        create: { userId: user.id, role: nextRole },
      });
      await recordAdminAction({
        actorId,
        action: existing ? "STAFF_ROLE_CHANGED" : "STAFF_GRANTED",
        targetType: "StaffMember",
        targetId: user.id,
        summary: `${user.email} → staff ${nextRole}${
          existing ? ` (avant : ${existing.role})` : ""
        }`,
      });
    }

    revalidatePath(`/admin/users/${user.id}`);
    revalidatePath("/admin/staff");

    return { ok: true };
  });
}
