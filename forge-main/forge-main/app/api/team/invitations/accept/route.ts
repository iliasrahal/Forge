import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("read");
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const invitation = token
      ? await prisma.teamInvitation.findUnique({
          where: { tokenHash: createHash("sha256").update(token).digest("hex") },
        })
      : null;

    if (
      !invitation ||
      invitation.status !== "PENDING" ||
      invitation.expiresAt <= new Date() ||
      invitation.email.toLowerCase() !== context.user.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "Cette invitation est invalide ou expirée." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: context.user.id,
            organizationId: invitation.organizationId,
          },
        },
        update: { role: invitation.role },
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
      prisma.session.update({
        where: { id: context.session.id },
        data: { activeOrganizationId: invitation.organizationId },
      }),
    ]);

    return NextResponse.json({ workspaceId: invitation.organizationId });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible d’accepter l’invitation." }, { status: 500 });
  }
}
