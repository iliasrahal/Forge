import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

export async function PATCH(request: Request) {
  try {
    const context = await requireWorkspaceContext("read");
    const body = await request.json();
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: context.user.id,
          organizationId: workspaceId,
        },
      },
      select: { organizationId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Cet espace est inaccessible." }, { status: 404 });
    }

    await prisma.session.update({
      where: { id: context.session.id },
      data: { activeOrganizationId: membership.organizationId },
    });
    return NextResponse.json({ activeWorkspaceId: membership.organizationId });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de changer d’espace." }, { status: 500 });
  }
}
