import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { sendAccountDeletedEmail } from "@/src/lib/email";

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
      include: { user: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Ta session a expiré. Reconnecte-toi." },
        { status: 401 },
      );
    }

    const ownedTeam = await prisma.organizationMember.findFirst({
      where: {
        userId: session.userId,
        role: "OWNER",
        organization: { type: "TEAM" },
      },
      select: { id: true },
    });

    if (ownedTeam) {
      return NextResponse.json(
        { error: "Transfère ou supprime ton équipe avant de supprimer ton compte." },
        { status: 409 },
      );
    }

    await prisma.user.delete({ where: { id: session.userId } });

    try {
      await sendAccountDeletedEmail(
        session.user.email,
        session.user.firstName,
      );
    } catch (error) {
      console.error("Erreur envoi confirmation suppression :", error);
    }

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
