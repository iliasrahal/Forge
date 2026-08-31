"use server";

import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

type Result = { ok: true } | { ok: false; error: string };

export async function changeOwnPassword(formData: FormData): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Ta session a expiré. Reconnecte-toi." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, error: "Complète tous les champs." };
  }
  if (newPassword.length < 8) {
    return {
      ok: false,
      error: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
    };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Les nouveaux mots de passe ne correspondent pas." };
  }

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "L'ancien mot de passe est incorrect." };
  }

  const passwordHash = await hash(newPassword, 12);
  const currentToken = (await cookies()).get("forgeSession")?.value ?? "";

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    }),
    // Toutes les autres sessions sont invalidées, on garde celle en cours.
    prisma.session.deleteMany({
      where: { userId: user.id, token: { not: currentToken } },
    }),
  ]);

  return { ok: true };
}
