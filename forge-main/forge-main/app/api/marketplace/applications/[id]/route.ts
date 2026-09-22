import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";

import { canAcceptMarketplaceApplication, canManageMarketplacePosting } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    if (!["accept", "reject", "cancel"].includes(action)) return NextResponse.json({ error: "Action invalide." }, { status: 400 });

    const run = () => prisma.$transaction(async (tx) => {
      const application = await tx.marketplaceJobApplication.findUnique({
        where: { id },
        select: {
          id: true, status: true, applicantUserId: true,
          posting: { select: { id: true, organizationId: true, createdByUserId: true, status: true, positions: true } },
        },
      });
      if (!application) throw new Error("MARKETPLACE_APPLICATION_NOT_FOUND");
      if (action === "cancel") {
        if (application.applicantUserId !== context.user.id || application.status !== "PENDING") throw new Error("MARKETPLACE_APPLICATION_FORBIDDEN");
        return tx.marketplaceJobApplication.update({ where: { id }, data: { status: "CANCELLED" } });
      }
      if (!canManageMarketplacePosting({ postingOrganizationId: application.posting.organizationId, postingCreatedByUserId: application.posting.createdByUserId, activeOrganizationId: context.workspace.id, userId: context.user.id, role: context.membership.role })) throw new Error("MARKETPLACE_APPLICATION_FORBIDDEN");
      if (application.status !== "PENDING") throw new Error("MARKETPLACE_APPLICATION_DECIDED");
      if (action === "reject") return tx.marketplaceJobApplication.update({ where: { id }, data: { status: "REJECTED", respondedByUserId: context.user.id, respondedAt: new Date() } });

      await tx.marketplaceJobPosting.update({ where: { id: application.posting.id }, data: { updatedAt: new Date() } });
      const acceptedCount = await tx.marketplaceJobApplication.count({ where: { postingId: application.posting.id, status: "ACCEPTED" } });
      if (!canAcceptMarketplaceApplication({ postingStatus: application.posting.status, acceptedCount, positions: application.posting.positions })) throw new Error("MARKETPLACE_FILLED");
      const accepted = await tx.marketplaceJobApplication.update({ where: { id }, data: { status: "ACCEPTED", respondedByUserId: context.user.id, respondedAt: new Date() } });
      if (acceptedCount + 1 >= application.posting.positions) {
        await tx.marketplaceJobPosting.update({ where: { id: application.posting.id }, data: { status: "FILLED", closedAt: new Date() } });
      }
      return accepted;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const application = await run();
        return NextResponse.json({ application });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
        throw error;
      }
    }
    throw new Error("MARKETPLACE_CONCURRENCY_FAILED");
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    const message = error instanceof Error ? error.message : "";
    if (message === "MARKETPLACE_APPLICATION_NOT_FOUND") return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    if (message === "MARKETPLACE_APPLICATION_FORBIDDEN") return NextResponse.json({ error: "Tu ne peux pas gérer cette demande." }, { status: 403 });
    if (message === "MARKETPLACE_APPLICATION_DECIDED") return NextResponse.json({ error: "Cette demande a déjà été traitée." }, { status: 409 });
    if (message === "MARKETPLACE_FILLED") return NextResponse.json({ error: "Toutes les places sont déjà prises." }, { status: 409 });
    return NextResponse.json({ error: "Impossible de mettre à jour cette demande." }, { status: 500 });
  }
}
