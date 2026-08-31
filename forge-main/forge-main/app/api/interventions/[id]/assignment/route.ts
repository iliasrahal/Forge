import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();
    const assignedToId = typeof body.assignedToId === "string" && body.assignedToId ? body.assignedToId : null;

    if (assignedToId) {
      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: assignedToId,
            organizationId: context.workspace.id,
          },
        },
        select: { id: true },
      });
      if (!member) return NextResponse.json({ error: "Ce collaborateur n’appartient pas à cet espace." }, { status: 400 });
    }

    const result = await prisma.intervention.updateMany({
      where: { id, organizationId: context.workspace.id },
      data: { assignedToId },
    });
    if (result.count !== 1) return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible d’attribuer l’intervention." }, { status: 500 });
  }
}
