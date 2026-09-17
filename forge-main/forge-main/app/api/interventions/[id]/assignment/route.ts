import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();
    const action = body.action === "add" || body.action === "remove" ? body.action : null;
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!action || !userId) return NextResponse.json({ error: "Affectation invalide." }, { status: 400 });

    const [intervention, member] = await Promise.all([
      prisma.intervention.findFirst({ where: { id, organizationId: context.workspace.id }, select: { id: true } }),
      prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: context.workspace.id,
          },
        },
        select: { userId: true },
      }),
    ]);
    if (!intervention) return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });
    if (!member) return NextResponse.json({ error: "Ce collaborateur n’appartient pas à cet espace." }, { status: 400 });

    if (action === "add") {
      await prisma.interventionAssignment.upsert({
        where: { interventionId_userId: { interventionId: id, userId } },
        create: { interventionId: id, userId, organizationId: context.workspace.id },
        update: {},
      });
    } else {
      await prisma.interventionAssignment.deleteMany({ where: { interventionId: id, userId, organizationId: context.workspace.id } });
    }
    const assignments = await prisma.interventionAssignment.findMany({
      where: { interventionId: id, organizationId: context.workspace.id },
      select: { userId: true }, orderBy: { createdAt: "asc" },
    });
    await prisma.intervention.update({ where: { id }, data: { assignedToId: assignments[0]?.userId ?? null } });
    return NextResponse.json({ userIds: assignments.map((assignment) => assignment.userId) });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("UPDATE INTERVENTION ASSIGNMENTS ERROR", error);
    return NextResponse.json({ error: "Impossible d’attribuer l’intervention." }, { status: 500 });
  }
}
