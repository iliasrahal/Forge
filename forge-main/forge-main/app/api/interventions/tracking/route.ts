import { NextResponse } from "next/server";
import { computeInterventionProfitability } from "@/src/lib/intervention-profitability";
import { formatParisDateKey, parseParisDateTime } from "@/src/lib/paris-datetime";
import { prisma } from "@/src/lib/prisma";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

function normalize(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const workspace = await requireWorkspaceContext(body.type === "query" ? "read" : "write");
    const entity = typeof body.entity === "string" ? normalize(body.entity) : "";
    if (!entity) return NextResponse.json({ error: "Précise le chantier concerné." }, { status: 400 });
    const candidates = await prisma.intervention.findMany({
      where: { organizationId: workspace.workspace.id, status: { not: "ANNULEE" } },
      include: { client: true }, orderBy: { scheduledAt: "desc" }, take: 100,
    });
    const matches = candidates.filter((item) => {
      const client = item.client?.type === "PROFESSIONNEL" ? item.client.companyName ?? "" : `${item.client?.firstName ?? ""} ${item.client?.lastName ?? ""}`;
      return normalize(`${item.title} ${client}`).includes(entity);
    });
    if (matches.length !== 1) return NextResponse.json({ error: matches.length ? "Plusieurs chantiers correspondent. Précise davantage." : "Aucun chantier correspondant n’a été trouvé." }, { status: matches.length ? 409 : 404 });
    const intervention = matches[0];
    const dateKey = typeof body.date === "string" ? body.date : formatParisDateKey(new Date());
    const date = parseParisDateTime(dateKey, "00:00");
    if (!date) return NextResponse.json({ error: "Date invalide." }, { status: 400 });

    if (body.type === "expense") {
      const amountCents = Number(body.amountCents);
      if (!Number.isInteger(amountCents) || amountCents <= 0) return NextResponse.json({ error: "Précise un montant valide." }, { status: 400 });
      const allowed = ["MATERIALS", "SUPPLIES", "TRAVEL", "RENTAL", "SUBCONTRACTING", "OTHER"];
      const expense = await prisma.interventionExpense.create({ data: {
        interventionId: intervention.id, organizationId: workspace.workspace.id, createdByUserId: workspace.user.id,
        amountCents, category: allowed.includes(body.category) ? body.category : "OTHER",
        supplier: typeof body.supplier === "string" && body.supplier.trim() ? body.supplier.trim() : null,
        description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
        expenseDate: date, dayDate: date,
      } });
      return NextResponse.json({ message: "La dépense a été ajoutée au chantier.", interventionId: intervention.id, expense });
    }
    if (body.type === "time") {
      const durationMinutes = Number(body.durationMinutes);
      if (!Number.isInteger(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) return NextResponse.json({ error: "Précise une durée valide." }, { status: 400 });
      const member = await prisma.organizationMember.findUnique({ where: { userId_organizationId: { userId: workspace.user.id, organizationId: workspace.workspace.id } }, select: { hourlyCostCents: true } });
      const startedAt = date;
      const entry = await prisma.interventionWorkTime.create({ data: {
        interventionId: intervention.id, organizationId: workspace.workspace.id, userId: workspace.user.id,
        dayDate: date, startedAt, endedAt: startedAt, durationMinutes, hourlyCostCents: member?.hourlyCostCents ?? null, manual: true,
      } });
      return NextResponse.json({ message: "Le temps passé a été ajouté au chantier.", interventionId: intervention.id, entry });
    }
    const full = await prisma.intervention.findFirst({ where: {
      id: intervention.id,
      organizationId: workspace.workspace.id,
    }, include: {
      quote: { select: { status: true, amountCents: true, totalCostCents: true } },
      invoices: {
        where: { organizationId: workspace.workspace.id },
        select: { status: true, amountCents: true, payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } } },
      },
      expenses: {
        where: { organizationId: workspace.workspace.id },
        select: { amountCents: true },
      },
      workTimes: {
        where: { organizationId: workspace.workspace.id },
        select: { durationMinutes: true, hourlyCostCents: true },
      },
    } });
    if (!full) return NextResponse.json({ error: "Chantier introuvable." }, { status: 404 });
    return NextResponse.json({ interventionId: full.id, profitability: computeInterventionProfitability(full) });
  } catch (error) {
    const accessError = getWorkspaceErrorResponse(error);
    if (accessError) return NextResponse.json(accessError.body, { status: accessError.status });
    console.error("FORGE INTERVENTION TRACKING ERROR", error);
    return NextResponse.json({ error: "Impossible de mettre à jour le chantier." }, { status: 500 });
  }
}
