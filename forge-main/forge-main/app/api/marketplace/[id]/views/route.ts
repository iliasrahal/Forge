import { NextResponse } from "next/server";

import { shouldRecordMarketplaceView } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireWorkspaceContext("read");
    const { id } = await params;
    const posting = await prisma.marketplaceJobPosting.findUnique({
      where: { id },
      select: {
        id: true,
        organization: {
          select: {
            members: {
              where: { userId: context.user.id },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });
    if (!posting) return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    if (!shouldRecordMarketplaceView({ isPublisherMember: posting.organization.members.length > 0 })) {
      return NextResponse.json({ recorded: false });
    }
    await prisma.marketplaceJobView.upsert({
      where: { postingId_viewerUserId: { postingId: id, viewerUserId: context.user.id } },
      create: { postingId: id, viewerUserId: context.user.id },
      update: { lastViewedAt: new Date(), viewCount: { increment: 1 } },
    });
    return NextResponse.json({ recorded: true });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    return NextResponse.json({ error: "Consultation non enregistrée." }, { status: 500 });
  }
}
