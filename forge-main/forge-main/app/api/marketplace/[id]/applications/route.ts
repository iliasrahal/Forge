import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";

import { prisma } from "@/src/lib/prisma";
import { getMarketplaceApplicationBlockReason } from "@/src/lib/marketplace";
import { checkRateLimit } from "@/src/lib/rate-limit";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id } = await params;
    const limit = checkRateLimit(`marketplace:apply:${context.user.id}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ error: "Trop de demandes. Réessaie plus tard." }, { status: 429 });
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
    const result = await prisma.$transaction(async (tx) => {
      const posting = await tx.marketplaceJobPosting.findUnique({
        where: { id },
        select: {
          id: true, status: true, positions: true, organizationId: true,
          applications: { where: { status: "ACCEPTED" }, select: { id: true } },
        },
      });
      if (!posting) throw new Error("MARKETPLACE_NOT_FOUND");
      const [publisherMembership, existingApplication] = await Promise.all([
        tx.organizationMember.findUnique({ where: { userId_organizationId: { userId: context.user.id, organizationId: posting.organizationId } }, select: { id: true } }),
        tx.marketplaceJobApplication.findUnique({ where: { postingId_applicantUserId: { postingId: id, applicantUserId: context.user.id } }, select: { id: true } }),
      ]);
      const blocked = getMarketplaceApplicationBlockReason({ postingStatus: posting.status, acceptedCount: posting.applications.length, positions: posting.positions, isPublisherMember: Boolean(publisherMembership), hasExistingApplication: Boolean(existingApplication) });
      if (blocked === "OWN_POSTING") throw new Error("MARKETPLACE_OWN_POSTING");
      if (blocked === "DUPLICATE") throw new Error("MARKETPLACE_DUPLICATE");
      if (blocked === "UNAVAILABLE") throw new Error("MARKETPLACE_UNAVAILABLE");
      return tx.marketplaceJobApplication.create({
        data: { postingId: id, applicantUserId: context.user.id, representedOrganizationId: context.workspace.id, message: message || null },
        select: { id: true, status: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ application: result }, { status: 201 });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Tu as déjà envoyé une demande pour ce chantier." }, { status: 409 });
    const message = error instanceof Error ? error.message : "";
    if (message === "MARKETPLACE_NOT_FOUND") return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    if (message === "MARKETPLACE_UNAVAILABLE") return NextResponse.json({ error: "Ce chantier n’accepte plus de demandes." }, { status: 409 });
    if (message === "MARKETPLACE_OWN_POSTING") return NextResponse.json({ error: "Tu ne peux pas rejoindre une annonce publiée par ton propre espace." }, { status: 409 });
    if (message === "MARKETPLACE_DUPLICATE") return NextResponse.json({ error: "Tu as déjà envoyé une demande pour ce chantier." }, { status: 409 });
    return NextResponse.json({ error: "Impossible d’envoyer la demande." }, { status: 500 });
  }
}
