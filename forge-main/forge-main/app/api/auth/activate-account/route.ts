import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim() ?? "";

    if (!token) {
      return NextResponse.json(
        { error: "Ce lien est invalide ou incomplet." },
        { status: 400 },
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const activationToken = await prisma.accountActivationToken.findUnique({
      where: { tokenHash },
    });

    if (
      !activationToken ||
      activationToken.usedAt ||
      activationToken.expiresAt <= new Date()
    ) {
      return NextResponse.json(
        { error: "Ce lien est invalide ou a expiré." },
        { status: 400 },
      );
    }

    const consumedToken = await prisma.accountActivationToken.updateMany({
      where: {
        id: activationToken.id,
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

    await prisma.user.update({
      where: { id: activationToken.userId },
      data: { emailVerifiedAt: new Date() },
    });

    return NextResponse.json({ message: "Compte activé." });
  } catch (error) {
    console.error("Erreur activation compte :", error);
    return NextResponse.json(
      { error: "Impossible d’activer le compte." },
      { status: 500 },
    );
  }
}
