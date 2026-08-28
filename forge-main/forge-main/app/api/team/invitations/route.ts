import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sendTeamInvitationEmail } from "@/src/lib/email";
import { prisma } from "@/src/lib/prisma";

type InvitationBody = {
  emails?: string[];
  organizationName?: string;
};

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("forgeSession")?.value;
    const session = token
      ? await prisma.session.findUnique({
          where: { token },
          include: { user: true },
        })
      : null;

    if (!session || session.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Ta session a expiré. Reconnecte-toi." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as InvitationBody;
    const organizationName = body.organizationName?.trim() ?? "";
    const emails = [
      ...new Set(
        (body.emails ?? []).map((email) =>
          email.trim().toLowerCase(),
        ),
      ),
    ].filter(
      (email) =>
        email.includes("@") &&
        email !== session.user.email.toLowerCase(),
    );

    if (!organizationName || emails.length === 0) {
      return NextResponse.json(
        { error: "Ajoute au moins une adresse e-mail valide." },
        { status: 400 },
      );
    }

    let membership = await prisma.organizationMember.findFirst({
      where: { userId: session.userId },
      include: { organization: true },
    });

    if (!membership) {
      const organization = await prisma.organization.create({
        data: {
          name: organizationName,
          members: {
            create: { userId: session.userId, role: "OWNER" },
          },
        },
      });
      membership = await prisma.organizationMember.findFirstOrThrow({
        where: {
          userId: session.userId,
          organizationId: organization.id,
        },
        include: { organization: true },
      });
    }

    if (membership.role === "TECHNICIAN") {
      return NextResponse.json(
        { error: "Tu n’as pas accès à la gestion de l’équipe." },
        { status: 403 },
      );
    }

    const appUrl = (
      process.env.APP_URL || new URL(request.url).origin
    ).replace(/\/$/, "");

    await Promise.all(
      emails.map(async (email) => {
        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256")
          .update(rawToken)
          .digest("hex");

        await prisma.teamInvitation.create({
          data: {
            email,
            role: "TECHNICIAN",
            tokenHash,
            expiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ),
            organizationId: membership.organizationId,
            invitedById: session.userId,
          },
        });

        await sendTeamInvitationEmail(
          email,
          membership.organization.name,
          `${appUrl}/register?invitation=${rawToken}`,
        );
      }),
    );

    return NextResponse.json({ count: emails.length });
  } catch (error) {
    console.error("Erreur invitations équipe :", error);
    return NextResponse.json(
      { error: "Impossible d’envoyer les invitations. Réessaie dans un instant." },
      { status: 500 },
    );
  }
}
