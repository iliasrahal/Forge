import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { isPaidSubscriptionActive } from "@/src/lib/subscription-policy";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type Props = { params: Promise<{ memberId: string }> };

export async function PATCH(request: Request, { params }: Props) {
  try {
    const context = await requireWorkspaceContext("manageTeam");
    const { memberId } = await params;
    const body = await request.json();
    const role = body.role === "ADMIN" || body.role === "READ_ONLY" ? body.role : null;
    if (!role) return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });

    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: context.workspace.id,
        role: { not: "OWNER" },
      },
      select: {
        id: true,
        role: true,
        user: { select: { subscriptionStatus: true } },
      },
    });
    if (!member) return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });

    if (
      role === "ADMIN" &&
      !isPaidSubscriptionActive(member.user.subscriptionStatus)
    ) {
      return NextResponse.json(
        {
          error:
            "Ce collaborateur ne peut pas passer en accès Admin car il ne possède pas d’abonnement Forge actif.",
          detail:
            "Il pourra être passé en Admin dès que son abonnement Forge sera actif.",
          code: "ACTIVE_SUBSCRIPTION_REQUIRED",
        },
        { status: 403 },
      );
    }

    await prisma.organizationMember.update({
      where: { id: member.id },
      data: { role },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de modifier ce membre." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const context = await requireWorkspaceContext("manageTeam");
    const { memberId } = await params;
    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: context.workspace.id,
        role: { not: "OWNER" },
      },
      select: { id: true, userId: true },
    });
    if (!member) return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });

    await prisma.$transaction([
      prisma.intervention.updateMany({
        where: { organizationId: context.workspace.id, assignedToId: member.userId },
        data: { assignedToId: null },
      }),
      prisma.organizationMember.delete({ where: { id: member.id } }),
      prisma.session.updateMany({
        where: { userId: member.userId, activeOrganizationId: context.workspace.id },
        data: { activeOrganizationId: null },
      }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de retirer ce membre." }, { status: 500 });
  }
}
