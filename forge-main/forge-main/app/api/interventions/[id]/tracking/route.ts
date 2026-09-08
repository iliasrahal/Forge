import { NextResponse } from "next/server";

import { formatParisDateKey, parseParisDateTime } from "@/src/lib/paris-datetime";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

type Context = { params: Promise<{ id: string }> };
const categories = ["MATERIALS", "SUPPLIES", "TRAVEL", "RENTAL", "SUBCONTRACTING", "OTHER"] as const;

function cents(value: unknown) {
  const amount = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
}

async function contextFor(id: string) {
  const workspace = await requireWorkspaceContext("write");
  const intervention = await prisma.intervention.findFirst({
    where: { id, organizationId: workspace.workspace.id },
    select: { id: true, organizationId: true, scheduledAt: true, endDate: true },
  });
  return { workspace, intervention };
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { workspace, intervention } = await contextFor(id);
    if (!intervention?.organizationId) return NextResponse.json({ error: "Chantier introuvable." }, { status: 404 });
    const body = await request.json();
    const type = body.type;
    const dateKey = typeof body.date === "string" ? body.date : formatParisDateKey(new Date());
    const dayDate = parseParisDateTime(dateKey, "00:00");
    if (!dayDate) return NextResponse.json({ error: "Date invalide." }, { status: 400 });

    if (type === "expense") {
      const amountCents = cents(body.amount);
      if (!amountCents) return NextResponse.json({ error: "Le montant doit être supérieur à zéro." }, { status: 400 });
      const category = categories.includes(body.category) ? body.category : "OTHER";
      const expense = await prisma.interventionExpense.create({ data: {
        interventionId: id,
        organizationId: intervention.organizationId,
        createdByUserId: workspace.user.id,
        dayDate,
        expenseDate: dayDate,
        amountCents,
        category,
        supplier: typeof body.supplier === "string" && body.supplier.trim() ? body.supplier.trim() : null,
        description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      } });
      return NextResponse.json({ expense }, { status: 201 });
    }

    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: workspace.user.id, organizationId: intervention.organizationId } },
      select: { hourlyCostCents: true },
    });
    if (type === "time-start") {
      const running = await prisma.interventionWorkTime.findFirst({ where: { interventionId: id, userId: workspace.user.id, endedAt: null } });
      if (running) return NextResponse.json({ error: "Un chronomètre est déjà en cours sur ce chantier." }, { status: 409 });
      const entry = await prisma.interventionWorkTime.create({ data: {
        interventionId: id, organizationId: intervention.organizationId, userId: workspace.user.id,
        dayDate, startedAt: new Date(), hourlyCostCents: membership?.hourlyCostCents ?? null,
      } });
      return NextResponse.json({ entry }, { status: 201 });
    }
    if (type === "time-stop") {
      const running = await prisma.interventionWorkTime.findFirst({ where: { interventionId: id, userId: workspace.user.id, endedAt: null }, orderBy: { startedAt: "desc" } });
      if (!running) return NextResponse.json({ error: "Aucun chronomètre n’est en cours." }, { status: 409 });
      const endedAt = new Date();
      const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - running.startedAt.getTime()) / 60000));
      const entry = await prisma.interventionWorkTime.update({ where: { id: running.id }, data: { endedAt, durationMinutes } });
      return NextResponse.json({ entry });
    }
    if (type === "time-manual") {
      const durationMinutes = Math.round(Number(body.durationMinutes));
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) return NextResponse.json({ error: "La durée doit être comprise entre 1 minute et 24 heures." }, { status: 400 });
      const startedAt = parseParisDateTime(dateKey, "12:00") ?? dayDate;
      const entry = await prisma.interventionWorkTime.create({ data: {
        interventionId: id, organizationId: intervention.organizationId, userId: workspace.user.id,
        dayDate, startedAt, endedAt: startedAt, durationMinutes, hourlyCostCents: membership?.hourlyCostCents ?? null, manual: true,
      } });
      return NextResponse.json({ entry }, { status: 201 });
    }
    return NextResponse.json({ error: "Type de suivi invalide." }, { status: 400 });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("CREATE INTERVENTION TRACKING ERROR", error);
    return NextResponse.json({ error: "Impossible d’enregistrer cette information." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { intervention } = await contextFor(id);
    if (!intervention?.organizationId) return NextResponse.json({ error: "Chantier introuvable." }, { status: 404 });
    const body = await request.json();
    if (body.type === "expense") {
      const amountCents = cents(body.amount);
      if (!amountCents) return NextResponse.json({ error: "Le montant doit être supérieur à zéro." }, { status: 400 });
      const category = categories.includes(body.category) ? body.category : "OTHER";
      const expenseDate = typeof body.date === "string" ? parseParisDateTime(body.date, "00:00") : null;
      if (!expenseDate) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
      const result = await prisma.interventionExpense.updateMany({ where: { id: body.id, interventionId: id, organizationId: intervention.organizationId }, data: {
        amountCents, category, expenseDate, dayDate: expenseDate,
        supplier: typeof body.supplier === "string" && body.supplier.trim() ? body.supplier.trim() : null,
        description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      } });
      if (!result.count) return NextResponse.json({ error: "Dépense introuvable." }, { status: 404 });
      return NextResponse.json({ success: true });
    }
    const durationMinutes = Math.round(Number(body.durationMinutes));
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) return NextResponse.json({ error: "Durée invalide." }, { status: 400 });
    const dayDate = typeof body.date === "string" ? parseParisDateTime(body.date, "00:00") : null;
    if (!dayDate) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    const result = await prisma.interventionWorkTime.updateMany({ where: { id: body.id, interventionId: id, organizationId: intervention.organizationId }, data: { durationMinutes, dayDate } });
    if (!result.count) return NextResponse.json({ error: "Temps introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de modifier cette entrée." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { intervention } = await contextFor(id);
    if (!intervention?.organizationId) return NextResponse.json({ error: "Chantier introuvable." }, { status: 404 });
    const body = await request.json();
    if (body.type !== "expense" && body.type !== "time") {
      return NextResponse.json({ error: "Type de suivi invalide." }, { status: 400 });
    }
    const result = body.type === "expense"
      ? await prisma.interventionExpense.deleteMany({ where: { id: body.id, interventionId: id, organizationId: intervention.organizationId } })
      : await prisma.interventionWorkTime.deleteMany({ where: { id: body.id, interventionId: id, organizationId: intervention.organizationId } });
    if (!result.count) return NextResponse.json({ error: "Entrée introuvable." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    return NextResponse.json({ error: "Impossible de supprimer cette entrée." }, { status: 500 });
  }
}
