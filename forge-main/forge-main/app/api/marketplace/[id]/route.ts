import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";

import { canDeleteMarketplacePosting, canManageMarketplacePosting, parseMarketplacePostingInput } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id } = await params;
    const posting = await prisma.marketplaceJobPosting.findUnique({
      where: { id },
      select: { id: true, organizationId: true, createdByUserId: true, status: true },
    });
    if (!posting) return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    if (!canManageMarketplacePosting({ postingOrganizationId: posting.organizationId, postingCreatedByUserId: posting.createdByUserId, activeOrganizationId: context.workspace.id, userId: context.user.id, role: context.membership.role })) {
      return NextResponse.json({ error: "Tu ne peux pas modifier cette annonce." }, { status: 403 });
    }
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "close") {
      await prisma.marketplaceJobPosting.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } });
      return NextResponse.json({ ok: true });
    }
    if (posting.status !== "OPEN") return NextResponse.json({ error: "Seule une annonce ouverte peut être modifiée." }, { status: 409 });
    const input = parseMarketplacePostingInput(body);
    if (!input) return NextResponse.json({ error: "Vérifie les informations du chantier." }, { status: 400 });
    const { requirements, ...postingData } = input;
    await prisma.$transaction(async (tx) => {
      await tx.marketplaceJobPosting.update({ where: { id }, data: { updatedAt: new Date() } });
      const acceptedCount = await tx.marketplaceJobApplication.count({ where: { postingId: id, status: "ACCEPTED" } });
      if (input.positions < acceptedCount) throw new Error("MARKETPLACE_POSITIONS_TOO_LOW");
      const existingRequirementApplications = await tx.marketplaceJobApplication.count({ where: { postingId: id } });
      if (existingRequirementApplications > 0) throw new Error("MARKETPLACE_REQUIREMENTS_LOCKED");
      await tx.marketplaceJobRequirement.deleteMany({ where: { postingId: id } });
      await tx.marketplaceJobPosting.update({ where: { id }, data: { ...postingData, requirements: { create: requirements }, status: "OPEN", closedAt: null } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    if (error instanceof Error && error.message === "MARKETPLACE_POSITIONS_TOO_LOW") return NextResponse.json({ error: "Le nombre de places ne peut pas être inférieur aux demandes déjà acceptées." }, { status: 409 });
    if (error instanceof Error && error.message === "MARKETPLACE_REQUIREMENTS_LOCKED") return NextResponse.json({ error: "Les besoins ne peuvent plus être remplacés après réception d’une demande." }, { status: 409 });
    return NextResponse.json({ error: "Impossible de modifier cette annonce." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id } = await params;
    const posting = await prisma.marketplaceJobPosting.findUnique({
      where: { id },
      select: { id: true, organizationId: true, createdByUserId: true },
    });
    if (!posting) return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    if (!canDeleteMarketplacePosting({ postingOrganizationId: posting.organizationId, postingCreatedByUserId: posting.createdByUserId, activeOrganizationId: context.workspace.id, userId: context.user.id, role: context.membership.role, canWrite: context.permissions.canWrite })) {
      return NextResponse.json({ error: "Tu ne peux pas supprimer cette annonce." }, { status: 403 });
    }
    await prisma.marketplaceJobPosting.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    return NextResponse.json({ error: "Impossible de supprimer cette annonce." }, { status: 500 });
  }
}
