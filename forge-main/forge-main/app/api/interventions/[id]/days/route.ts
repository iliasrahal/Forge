import { NextResponse } from "next/server";

import { listInterventionDateKeys, normalizeInterventionDayTasks } from "@/src/lib/intervention-day-tasks";
import { getInterventionDayDeletionProtection } from "@/src/lib/intervention-day-deletion";
import { prisma } from "@/src/lib/prisma";
import { formatParisDateKey, formatParisTime, getParisDayBounds, parseParisDateTime } from "@/src/lib/paris-datetime";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? parseParisDateTime(date, "00:00")
      : null;
    if (!dateValue) {
      return NextResponse.json({ error: "Choisissez une date valide." }, { status: 400 });
    }

    const intervention = await prisma.intervention.findFirst({
      where: { id, organizationId: workspace.workspace.id },
      select: {
        id: true,
        scheduledAt: true,
        endDate: true,
        excludedDays: { select: { date: true } },
      },
    });
    if (!intervention) {
      return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });
    }

    const startKey = formatParisDateKey(intervention.scheduledAt);
    const endKey = formatParisDateKey(intervention.endDate ?? intervention.scheduledAt);
    const excluded = intervention.excludedDays.some(
      (day) => formatParisDateKey(day.date) === date,
    );
    if (date >= startKey && date <= endKey && !excluded) {
      return NextResponse.json({ error: "Cette journée existe déjà dans le chantier." }, { status: 409 });
    }

    await prisma.$transaction(async (transaction) => {
      if (excluded) {
        await transaction.interventionExcludedDay.delete({
          where: { interventionId_date: { interventionId: id, date: dateValue } },
        });
        return;
      }

      if (date < startKey) {
        const scheduledAt = parseParisDateTime(date, formatParisTime(intervention.scheduledAt))!;
        await transaction.intervention.update({
          where: { id },
          data: {
            scheduledAt,
            endDate: intervention.endDate ?? intervention.scheduledAt,
          },
        });
        return;
      }

      const endTime = formatParisTime(intervention.endDate ?? intervention.scheduledAt);
      await transaction.intervention.update({
        where: { id },
        data: { endDate: parseParisDateTime(date, endTime)! },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("ADD INTERVENTION DAY ERROR", error);
    return NextResponse.json({ error: "Impossible d’ajouter cette journée." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();
    const intervention = await prisma.intervention.findFirst({
      where: { id, organizationId: workspace.workspace.id },
      select: { id: true, scheduledAt: true, endDate: true, startedAt: true, excludedDays: { select: { date: true } } },
    });
    if (!intervention) return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });

    const date = typeof body.date === "string" ? body.date : "";
    const [validDay] = normalizeInterventionDayTasks(
      [{ date, title: "Validation de la journée" }],
      intervention.scheduledAt,
      intervention.endDate,
    );
    if (!validDay) return NextResponse.json({ error: "Cette journée n’appartient pas au chantier." }, { status: 400 });
    if (intervention.excludedDays.some((day) => formatParisDateKey(day.date) === date)) {
      return NextResponse.json({ error: "Cette journée a été supprimée du chantier." }, { status: 409 });
    }

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

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const body = await request.json();
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const dateBounds = /^\d{4}-\d{2}-\d{2}$/.test(date) ? getParisDayBounds(date) : null;
    if (!dateBounds) {
      return NextResponse.json({ error: "Choisissez une journée valide." }, { status: 400 });
    }
    const dateValue = dateBounds.start;
    const dateRange = { gte: dateBounds.start, lt: dateBounds.nextStart };
    const intervention = await prisma.intervention.findFirst({
      where: { id, organizationId: workspace.workspace.id },
      select: {
        id: true,
        scheduledAt: true,
        endDate: true,
        excludedDays: { select: { date: true } },
        dayStates: { where: { date: dateRange } },
        dayTasks: { where: { date: dateRange } },
        workTimes: { where: { dayDate: dateRange }, select: { id: true }, take: 1 },
        expenses: { where: { dayDate: dateRange }, select: { id: true }, take: 1 },
      },
    });
    if (!intervention) return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });

    const excludedKeys = intervention.excludedDays.map((day) => formatParisDateKey(day.date));
    const days = listInterventionDateKeys(intervention.scheduledAt, intervention.endDate, excludedKeys);
    if (!days.includes(date)) return NextResponse.json({ error: "Cette journée n’appartient pas au chantier." }, { status: 400 });
    if (days.length === 1) return NextResponse.json({ error: "La dernière journée ne peut pas être supprimée. Supprimez plutôt le chantier." }, { status: 409 });

    const dayState = intervention.dayStates[0];
    const protection = getInterventionDayDeletionProtection({
      startedAt: dayState?.startedAt,
      completedAt: dayState?.completedAt,
      report: dayState?.report,
      hasWorkTimes: intervention.workTimes.length > 0,
      hasExpenses: intervention.expenses.length > 0,
      tasks: intervention.dayTasks,
    });
    if (protection === "IN_PROGRESS") {
      return NextResponse.json({ error: "Cette journée est en cours. Terminez-la avant de poursuivre ; son historique restera protégé." }, { status: 409 });
    }
    if (protection === "HISTORY") {
      return NextResponse.json({ error: "Cette journée contient déjà du temps, des dépenses ou un historique réalisé. Elle ne peut pas être supprimée." }, { status: 409 });
    }

    const remaining = days.filter((day) => day !== date);
    const isBoundary = date === days[0] || date === days[days.length - 1];
    await prisma.$transaction(async (transaction) => {
      await transaction.interventionDayTask.deleteMany({ where: { interventionId: id, date: dateRange } });
      await transaction.interventionDayState.deleteMany({ where: { interventionId: id, date: dateRange } });
      if (isBoundary) {
        const scheduledAt = parseParisDateTime(remaining[0], formatParisTime(intervention.scheduledAt))!;
        const currentEnd = intervention.endDate ?? intervention.scheduledAt;
        const endDate = parseParisDateTime(remaining[remaining.length - 1], formatParisTime(currentEnd))!;
        await transaction.intervention.update({ where: { id }, data: { scheduledAt, endDate } });
        await transaction.interventionExcludedDay.deleteMany({
          where: { interventionId: id, OR: [{ date: { lt: scheduledAt } }, { date: { gt: endDate } }] },
        });
      } else {
        await transaction.interventionExcludedDay.upsert({
          where: { interventionId_date: { interventionId: id, date: dateValue } },
          update: {},
          create: { interventionId: id, date: dateValue },
        });
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("DELETE INTERVENTION DAY ERROR", error);
    return NextResponse.json({ error: "Impossible de supprimer cette journée." }, { status: 500 });
  }
}
