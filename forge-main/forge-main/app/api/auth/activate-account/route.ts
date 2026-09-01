import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { ensurePersonalWorkspaceForUser } from "@/src/lib/workspace-access";

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

    const user = await prisma.user.update({
      where: { id: activationToken.userId },
      data: { emailVerifiedAt: new Date() },
      select: { id: true, email: true },
    });

    const personalWorkspace = await ensurePersonalWorkspaceForUser(user.id);
    const invitedMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organization: {
          type: "TEAM",
          invitations: {
            some: {
              email: { equals: user.email, mode: "insensitive" },
              status: "ACCEPTED",
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        organizationId: true,
        role: true,
        organization: {
          select: {
            invitations: {
              where: {
                email: { equals: user.email, mode: "insensitive" },
                status: "ACCEPTED",
              },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { role: true },
            },
          },
        },
      },
    });
    const sessionToken = randomBytes(32).toString("hex");
    const sessionExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );

    await prisma.session.create({
      data: {
        token: sessionToken,
        expiresAt: sessionExpiresAt,
        userId: user.id,
        activeOrganizationId:
          invitedMembership?.organizationId ?? personalWorkspace.id,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set("forgeSession", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: sessionExpiresAt,
    });

    const invitationWasDowngraded =
      invitedMembership?.role === "READ_ONLY" &&
      invitedMembership.organization.invitations[0]?.role === "ADMIN";

    return NextResponse.json({
      message: "Compte activé.",
      redirectTo: invitationWasDowngraded
        ? "/app?invitationAccess=read-only"
        : "/app",
    });
  } catch (error) {
    console.error("Erreur activation compte :", error);
    return NextResponse.json(
      { error: "Impossible d’activer le compte." },
      { status: 500 },
    );
  }
}
