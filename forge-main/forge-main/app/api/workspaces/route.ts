import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { isProSubscription } from "@/src/lib/subscription-policy";
import { countUserTeams } from "@/src/lib/team-access";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

export async function GET() {
  try {
    const context = await requireWorkspaceContext("read");
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: context.user.id },
      include: { organization: true },
      orderBy: [{ organization: { type: "asc" } }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      activeWorkspaceId: context.workspace.id,
      permissions: context.permissions,
      workspaces: memberships.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        type: membership.organization.type,
        role: membership.role,
      })),
    });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de charger les espaces." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireWorkspaceContext("write");
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Le nom de l’équipe est obligatoire." }, { status: 400 });
    }

    // Standard : une seule équipe. Pro : illimité.
    if (!isProSubscription(context.user.subscriptionStatus)) {
      const teamCount = await countUserTeams(context.user.id);
      if (teamCount >= 1) {
        return NextResponse.json(
          {
            error:
              "Tu es déjà dans une équipe. Passe à l’abonnement Pro (49,99 €) pour en créer ou en rejoindre plusieurs.",
            code: "TEAM_LIMIT_REACHED",
          },
          { status: 403 },
        );
      }
    }

    const workspace = await prisma.$transaction(async (transaction) => {
      const organization = await transaction.organization.create({
        data: {
          name,
          type: "TEAM",
          members: { create: { userId: context.user.id, role: "OWNER" } },
        },
      });
      await transaction.session.update({
        where: { id: context.session.id },
        data: { activeOrganizationId: organization.id },
      });
      await transaction.user.update({
        where: { id: context.user.id },
        data: { workMode: "TEAM" },
      });
      return organization;
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de créer l’équipe." }, { status: 500 });
  }
}
