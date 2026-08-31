import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

export async function PATCH() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("forgeSession")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Tu dois être connecté pour terminer l’onboarding." },
        { status: 401 },
      );
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Ta session a expiré. Reconnecte-toi." },
        { status: 401 },
      );
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { onboardingCompleted: true },
      select: {
        id: true,
        firstName: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erreur enregistrement onboarding :", error);

    return NextResponse.json(
      { error: "Impossible d’enregistrer les informations." },
      { status: 500 },
    );
  }
}
