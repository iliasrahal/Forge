import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { normalizeEmail } from "@/src/lib/email-normalization";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("read");
    const body = (await request.json()) as { token?: string };
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "Cette invitation est invalide." },
        { status: 400 },
      );
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: {
        tokenHash: createHash("sha256").update(token).digest("hex"),
      },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    if (!invitation || invitation.status === "REVOKED") {
      return NextResponse.json(
        { error: "Cette invitation est invalide." },
        { status: 400 },
      );
    }

    if (invitation.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Cette invitation a expiré." },
        { status: 410 },
      );
    }

    if (
      normalizeEmail(invitation.email) !== normalizeEmail(context.user.email)
    ) {
      return NextResponse.json(
        {
          error: `Cette invitation a été envoyée à ${invitation.email}. Connectez-vous avec ce compte pour rejoindre l’équipe.`,
          code: "INVITATION_EMAIL_MISMATCH",
        },
        { status: 403 },
      );
    }

    const existingMembership =
      await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: context.user.id,
            organizationId: invitation.organizationId,
          },
        },
        select: { id: true },
      });

    if (invitation.status === "ACCEPTED") {
      if (!existingMembership) {
        return NextResponse.json(
          { error: "Cette invitation a déjà été utilisée." },
          { status: 409 },
        );
      }

      return NextResponse.json({
        workspaceId: invitation.organizationId,
        workspaceName: invitation.organization.name,
        alreadyMember: true,
      });
    }

    if (existingMembership) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      return NextResponse.json({
        workspaceId: invitation.organizationId,
        workspaceName: invitation.organization.name,
        alreadyMember: true,
      });
    }

    await prisma.$transaction([
      prisma.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: context.user.id,
            organizationId: invitation.organizationId,
          },
        },
        update: {},
        create: {
          userId: context.user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      }),
    ]);

    return NextResponse.json({
      workspaceId: invitation.organizationId,
      workspaceName: invitation.organization.name,
      alreadyMember: false,
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);

    if (accessError) {
      return NextResponse.json(accessError.body, {
        status: accessError.status,
      });
    }

    console.error("Erreur acceptation invitation :", error);

    return NextResponse.json(
      { error: "Impossible d’accepter l’invitation." },
      { status: 500 },
    );
  }
}
