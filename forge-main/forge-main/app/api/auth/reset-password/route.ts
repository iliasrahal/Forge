import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
      passwordConfirmation?: string;
    };
    const token = body.token?.trim() ?? "";
    const password = body.password ?? "";

    if (!token || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 },
      );
    }

    if (password !== body.passwordConfirmation) {
      return NextResponse.json(
        { error: "Les mots de passe ne correspondent pas." },
        { status: 400 },
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const passwordHash = await hash(password, 12);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date()
    ) {
      return NextResponse.json(
        { error: "Ce lien est invalide ou a expiré." },
        { status: 400 },
      );
    }

    const consumedToken = await prisma.passwordResetToken.updateMany({
      where: {
        id: resetToken.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    if (consumedToken.count !== 1) {
      return NextResponse.json(
        { error: "Ce lien est invalide ou a expiré." },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return NextResponse.json({ message: "Mot de passe réinitialisé." });
  } catch (error) {
    console.error("Erreur réinitialisation mot de passe :", error);
    return NextResponse.json(
      { error: "Impossible de réinitialiser le mot de passe." },
      { status: 500 },
    );
  }
}
