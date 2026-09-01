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
      activeRole: context.membership.role,
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

export async function DELETE(request: Request) {
  try {
    const context = await requireWorkspaceContext("read");
    const body = await request.json().catch(() => ({}));
    const confirmName =
      typeof body.confirmName === "string" ? body.confirmName.trim() : "";

    if (context.workspace.type !== "TEAM") {
      return NextResponse.json(
        { error: "Un espace personnel ne peut pas être supprimé." },
        { status: 409 },
      );
    }

    if (context.membership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Seul le propriétaire de l’équipe peut la supprimer." },
        { status: 403 },
      );
    }

    if (confirmName !== context.workspace.name) {
      return NextResponse.json(
        { error: "Le nom de l’équipe ne correspond pas." },
        { status: 400 },
      );
    }

    // La suppression de l'organisation cascade (membres, clients, interventions,
    // devis, factures, invitations) ; activeOrganizationId repasse à null.
    await prisma.organization.delete({ where: { id: context.workspace.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("Erreur suppression équipe :", error);
    return NextResponse.json(
      { error: "Impossible de supprimer l’équipe." },
      { status: 500 },
    );
  }
}
