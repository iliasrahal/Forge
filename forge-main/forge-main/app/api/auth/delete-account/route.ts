import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("forgeSession")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Tu dois être connecté pour supprimer ton compte." },
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

    await prisma.user.delete({
      where: { id: session.userId },
    });

    cookieStore.set("forgeSession", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression compte :", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le compte." },
      { status: 500 },
    );
  }
}
