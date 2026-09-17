import { NextResponse } from "next/server";

import { listInterventionDateKeys } from "@/src/lib/intervention-day-tasks";
import { formatParisDateKey, parseParisDateTime } from "@/src/lib/paris-datetime";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();
    const action = body.action === "add" || body.action === "remove" ? body.action : null;
    const userId = typeof body.userId === "string" ? body.userId : "";
    const dateKey = typeof body.date === "string" ? body.date : "";
    const date = parseParisDateTime(dateKey);
    if (!action || !userId || !date) return NextResponse.json({ error: "Affectation invalide." }, { status: 400 });

    const [intervention, member] = await Promise.all([
      prisma.intervention.findFirst({
        where: { id, organizationId: context.workspace.id },
        select: { scheduledAt: true, endDate: true, excludedDays: { select: { date: true } } },
      }),
      prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId, organizationId: context.workspace.id } }, select: { userId: true },
      }),
    ]);
    if (!intervention) return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });
    if (!member) return NextResponse.json({ error: "Ce collaborateur n’appartient pas à cet espace." }, { status: 400 });
    const days = listInterventionDateKeys(intervention.scheduledAt, intervention.endDate, intervention.excludedDays.map((entry) => formatParisDateKey(entry.date)));
    if (!days.includes(dateKey)) return NextResponse.json({ error: "Cette journée n’appartient pas au chantier." }, { status: 400 });

    if (action === "add") {
      await prisma.interventionDayAssignment.upsert({
        where: { interventionId_date_userId: { interventionId: id, date, userId } },
        create: { interventionId: id, organizationId: context.workspace.id, date, userId }, update: {},
      });
    } else {
      await prisma.interventionDayAssignment.deleteMany({ where: { interventionId: id, organizationId: context.workspace.id, date, userId } });
    }
    const assignments = await prisma.interventionDayAssignment.findMany({
      where: { interventionId: id, organizationId: context.workspace.id, date }, select: { userId: true }, orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ userIds: assignments.map((assignment) => assignment.userId) });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("UPDATE INTERVENTION DAY ASSIGNMENTS ERROR", error);
    return NextResponse.json({ error: "Impossible d’affecter cette journée." }, { status: 500 });
  }
}
