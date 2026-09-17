import { NextResponse } from "next/server";

import {
  interventionDayTaskCreateData,
  normalizeInterventionDayTasks,
} from "@/src/lib/intervention-day-tasks";
import { prisma } from "@/src/lib/prisma";
import { formatParisDateKey } from "@/src/lib/paris-datetime";
import {
  getWorkspaceErrorResponse,
  requireWorkspaceContext,
} from "@/src/lib/workspace-access";

type RouteContext = { params: Promise<{ id: string }> };

async function getWritableIntervention(id: string, organizationId: string) {
  return prisma.intervention.findFirst({
    where: { id, organizationId },
    select: { id: true, scheduledAt: true, endDate: true, excludedDays: { select: { date: true } } },
  });
}

async function validAssignee(userId: unknown, organizationId: string) {
  if (typeof userId !== "string" || !userId) return null;
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { userId: true },
  });
  return member?.userId ?? null;
}

function isExcluded(intervention: Awaited<ReturnType<typeof getWritableIntervention>>, date: string) {
  return intervention?.excludedDays.some((day) => formatParisDateKey(day.date) === date) ?? false;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const intervention = await getWritableIntervention(id, workspace.workspace.id);
    if (!intervention) return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });
    const body = await request.json();
    const isGeneral = body.date === null || body.date === "" || body.date === undefined;
    const [task] = isGeneral ? [] : normalizeInterventionDayTasks([body], intervention.scheduledAt, intervention.endDate);
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    if (!title || (!isGeneral && !task)) return NextResponse.json({ error: "Le titre est obligatoire et la journée doit appartenir au chantier." }, { status: 400 });
    if (task && isExcluded(intervention, task.date)) return NextResponse.json({ error: "Cette journée a été supprimée du chantier." }, { status: 409 });
    const position = await prisma.interventionDayTask.count({ where: { interventionId: id } });
    const requestedAssignee = typeof body.assignedToId === "string" && body.assignedToId ? body.assignedToId : null;
    const assignedToId = await validAssignee(requestedAssignee, workspace.workspace.id);
    if (requestedAssignee && !assignedToId) return NextResponse.json({ error: "Ce responsable n’appartient pas à cet espace." }, { status: 400 });
    const created = await prisma.interventionDayTask.create({
      data: {
        ...(task ? interventionDayTaskCreateData(task) : {
          date: null,
          title,
          description: typeof body.description === "string" && body.description.trim() ? body.description.trim().slice(0, 1000) : null,
          startTime: null,
          endTime: null,
          report: null,
          position,
        }),
        interventionId: id,
        position,
        assignedToId,
      },
    });
    return NextResponse.json({ task: created }, { status: 201 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("CREATE INTERVENTION DAY TASK ERROR", error);
    return NextResponse.json({ error: "Impossible d’ajouter cette tâche." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const intervention = await getWritableIntervention(id, workspace.workspace.id);
    if (!intervention) return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });
    const body = await request.json();
    const taskId = typeof body.taskId === "string" ? body.taskId : "";
    const existing = await prisma.interventionDayTask.findFirst({ where: { id: taskId, interventionId: id } });
    if (!existing) return NextResponse.json({ error: "Tâche introuvable." }, { status: 404 });

    if (typeof body.completed === "boolean") {
      const task = await prisma.interventionDayTask.update({
        where: { id: taskId },
        data: {
          completedAt: body.completed ? new Date() : null,
          startedAt: body.completed ? existing.startedAt ?? new Date() : null,
          status: body.completed ? "DONE" : "TODO",
        },
      });
      return NextResponse.json({ task });
    }

    if (body.status === "TODO" || body.status === "IN_PROGRESS" || body.status === "DONE") {
      const now = new Date();
      const task = await prisma.interventionDayTask.update({
        where: { id: taskId },
        data: {
          status: body.status,
          startedAt: body.status === "TODO" ? null : existing.startedAt ?? now,
          completedAt: body.status === "DONE" ? existing.completedAt ?? now : null,
        },
      });
      return NextResponse.json({ task });
    }

    const isGeneral = body.date === null || body.date === "";
    if (isGeneral) {
      const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : existing.title;
      const requestedAssignee = typeof body.assignedToId === "string" && body.assignedToId ? body.assignedToId : null;
      const assignedToId = await validAssignee(requestedAssignee, workspace.workspace.id);
      if (requestedAssignee && !assignedToId) return NextResponse.json({ error: "Ce responsable n’appartient pas à cet espace." }, { status: 400 });
      const task = await prisma.interventionDayTask.update({ where: { id: taskId }, data: {
        date: null,
        title,
        description: typeof body.description === "string" && body.description.trim() ? body.description.trim().slice(0, 1000) : null,
        startTime: null,
        endTime: null,
        assignedToId,
      } });
      return NextResponse.json({ task });
    }

    const [normalized] = normalizeInterventionDayTasks([{
      date: body.date ?? (existing.date ? formatParisDateKey(existing.date) : ""),
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      startTime: body.startTime ?? existing.startTime,
      endTime: body.endTime ?? existing.endTime,
      report: body.report ?? existing.report,
    }], intervention.scheduledAt, intervention.endDate);
    if (!normalized) return NextResponse.json({ error: "Les informations de la tâche sont invalides." }, { status: 400 });
    if (isExcluded(intervention, normalized.date)) return NextResponse.json({ error: "Cette journée a été supprimée du chantier." }, { status: 409 });
    const requestedAssignee = typeof body.assignedToId === "string" && body.assignedToId ? body.assignedToId : null;
    const assignedToId = await validAssignee(requestedAssignee, workspace.workspace.id);
    if (requestedAssignee && !assignedToId) return NextResponse.json({ error: "Ce responsable n’appartient pas à cet espace." }, { status: 400 });
    const task = await prisma.interventionDayTask.update({
      where: { id: taskId },
      data: { ...interventionDayTaskCreateData(normalized), assignedToId },
    });
    return NextResponse.json({ task });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("UPDATE INTERVENTION DAY TASK ERROR", error);
    return NextResponse.json({ error: "Impossible de modifier cette tâche." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const workspace = await requireWorkspaceContext("write");
    const { id } = await params;
    const intervention = await getWritableIntervention(id, workspace.workspace.id);
    if (!intervention) return NextResponse.json({ error: "Intervention introuvable." }, { status: 404 });
    const body = await request.json();
    const taskId = typeof body.taskId === "string" ? body.taskId : "";
    const result = await prisma.interventionDayTask.deleteMany({ where: { id: taskId, interventionId: id } });
    if (!result.count) return NextResponse.json({ error: "Tâche introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("DELETE INTERVENTION DAY TASK ERROR", error);
    return NextResponse.json({ error: "Impossible de supprimer cette tâche." }, { status: 500 });
  }
}
