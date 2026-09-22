import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";

import { canManageMarketplacePosting, parseMarketplacePostingInput } from "@/src/lib/marketplace";
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
    await prisma.$transaction(async (tx) => {
      await tx.marketplaceJobPosting.update({ where: { id }, data: { updatedAt: new Date() } });
      const acceptedCount = await tx.marketplaceJobApplication.count({ where: { postingId: id, status: "ACCEPTED" } });
      if (input.positions < acceptedCount) throw new Error("MARKETPLACE_POSITIONS_TOO_LOW");
      await tx.marketplaceJobPosting.update({ where: { id }, data: { ...input, status: input.positions === acceptedCount ? "FILLED" : "OPEN", closedAt: input.positions === acceptedCount ? new Date() : null } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    if (error instanceof Error && error.message === "MARKETPLACE_POSITIONS_TOO_LOW") return NextResponse.json({ error: "Le nombre de places ne peut pas être inférieur aux demandes déjà acceptées." }, { status: 409 });
    return NextResponse.json({ error: "Impossible de modifier cette annonce." }, { status: 500 });
  }
}
