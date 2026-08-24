import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { sendPasswordResetEmail } from "@/src/lib/email";

const genericMessage =
  "Si cette adresse existe, un e-mail de réinitialisation a été envoyé.";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Saisis une adresse e-mail valide." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      await prisma.passwordResetToken.create({
        data: { tokenHash, expiresAt, userId: user.id },
      });

      const appUrl = process.env.APP_URL || new URL(request.url).origin;
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      try {
        await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
      } catch (error) {
        console.error("Erreur envoi réinitialisation :", error);
      }
    }

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Erreur demande réinitialisation :", error);
    return NextResponse.json({ error: genericMessage }, { status: 200 });
  }
}
