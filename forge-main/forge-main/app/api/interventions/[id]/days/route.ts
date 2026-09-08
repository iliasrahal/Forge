import { NextResponse } from "next/server";

import { normalizeInterventionDayTasks } from "@/src/lib/intervention-day-tasks";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();
    const intervention = await prisma.intervention.findFirst({
      where: { id, organizationId: workspace.workspace.id },
      select: { id: true, scheduledAt: true, endDate: true, startedAt: true },
    });
    if (!intervention) return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });

    const date = typeof body.date === "string" ? body.date : "";
    const [validDay] = normalizeInterventionDayTasks(
      [{ date, title: "Validation de la journée" }],
      intervention.scheduledAt,
      intervention.endDate,
    );
    if (!validDay) return NextResponse.json({ error: "Cette journée n’appartient pas au chantier." }, { status: 400 });

    const operation = body.operation;
    if (operation !== "start" && operation !== "complete" && operation !== "report") {
      return NextResponse.json({ error: "Action de journée invalide." }, { status: 400 });
    }
    const now = new Date();
    const state = await prisma.$transaction(async (transaction) => {
      if (operation === "start") {
        await transaction.intervention.update({
          where: { id },
          data: { status: "EN_COURS", startedAt: intervention.startedAt ?? now },
        });
      }
      return transaction.interventionDayState.upsert({
        where: { interventionId_date: { interventionId: id, date: validDay.dateValue } },
        create: {
          interventionId: id,
          date: validDay.dateValue,
          startedAt: operation === "start" || operation === "complete" ? now : null,
          completedAt: operation === "complete" ? now : null,
          report: typeof body.report === "string" && body.report.trim() ? body.report.trim() : null,
        },
        update: operation === "start"
          ? { startedAt: now, completedAt: null }
          : operation === "complete"
            ? { startedAt: now, completedAt: now }
            : operation === "report"
              ? { report: typeof body.report === "string" && body.report.trim() ? body.report.trim() : null }
              : {},
      });
    });
    return NextResponse.json({ state });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("UPDATE INTERVENTION DAY STATE ERROR", error);
    return NextResponse.json({ error: "Impossible de mettre à jour cette journée." }, { status: 500 });
  }
}
