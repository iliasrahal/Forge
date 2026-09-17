import { NextResponse } from "next/server";

import { computeClientFinancialSummary } from "@/src/lib/client-financials";
import { getClientDisplayName } from "@/src/lib/client-name";
import { prisma } from "@/src/lib/prisma";
import { buildStatistics, resolveStatisticsRange } from "@/src/lib/statistics";
import { getWorkspaceErrorResponse, requireWorkspaceContext } from "@/src/lib/workspace-access";

function normalize(value: string) {
  return value.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

async function resolveIntervention(organizationId: string, entity: string) {
  const candidates = await prisma.intervention.findMany({
    where: { organizationId, status: { not: "ANNULEE" } }, include: { client: true }, orderBy: { scheduledAt: "desc" }, take: 100,
  });
  const target = normalize(entity);
  const matches = candidates.filter((item) => normalize(`${item.title} ${item.client ? getClientDisplayName(item.client) : ""}`).includes(target));
  return { matches, intervention: matches.length === 1 ? matches[0] : null };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = typeof body.type === "string" ? body.type : "";
    const context = await requireWorkspaceContext(type === "assign" ? "write" : "read");
    const organizationId = context.workspace.id;

    if (type === "resolveIntervention") {
      const entity = typeof body.entity === "string" ? body.entity.trim() : "";
      if (!entity) return NextResponse.json({ error: "Précise l’intervention concernée." }, { status: 400 });
      const result = await resolveIntervention(organizationId, entity);
      if (!result.intervention) return NextResponse.json({ error: result.matches.length ? "Plusieurs interventions correspondent. Précise le client, le titre ou la date." : "Aucune intervention correspondante n’a été trouvée." }, { status: result.matches.length ? 409 : 404 });
      return NextResponse.json({ intervention: { id: result.intervention.id, title: result.intervention.title, clientName: result.intervention.client ? getClientDisplayName(result.intervention.client) : null } });
    }

    if (type === "assign") {
      const entity = typeof body.entity === "string" ? body.entity.trim() : "";
      const assignees: string[] = Array.isArray(body.assignees) ? body.assignees.filter((value: unknown): value is string => typeof value === "string" && Boolean(value.trim())).slice(0, 20) : [];
      if (!entity || !assignees.length) return NextResponse.json({ error: "Précise le chantier et les membres à affecter." }, { status: 400 });
      const [resolved, members] = await Promise.all([
        resolveIntervention(organizationId, entity),
        prisma.organizationMember.findMany({ where: { organizationId }, include: { user: { select: { firstName: true, lastName: true, email: true } } } }),
      ]);
      if (!resolved.intervention) return NextResponse.json({ error: resolved.matches.length ? "Plusieurs interventions correspondent. Précise davantage." : "Aucun chantier correspondant n’a été trouvé." }, { status: resolved.matches.length ? 409 : 404 });
      const selected = assignees.map((name: string) => {
        const target = normalize(name);
        const matches = members.filter((member) => normalize(`${member.user.firstName} ${member.user.lastName ?? ""} ${member.user.email}`).includes(target));
        return matches.length === 1 ? matches[0] : null;
      });
      if (selected.some((member: (typeof members)[number] | null) => !member)) return NextResponse.json({ error: "Un membre est introuvable ou ambigu dans cet espace." }, { status: 409 });
      await prisma.$transaction(selected.map((member: (typeof members)[number] | null) => prisma.interventionAssignment.upsert({
        where: { interventionId_userId: { interventionId: resolved.intervention!.id, userId: member!.userId } },
        create: { interventionId: resolved.intervention!.id, organizationId, userId: member!.userId }, update: {},
      })));
      return NextResponse.json({ message: `${assignees.join(" et ")} ${assignees.length > 1 ? "ont été ajoutés" : "a été ajouté"} au chantier ${resolved.intervention.title}.` });
    }

    if (type === "clientFinancial") {
      const entity = typeof body.entity === "string" ? body.entity.trim() : "";
      const clients = await prisma.client.findMany({ where: { organizationId, archived: false }, include: { invoices: { select: { status: true, amountCents: true, payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } }, creditNotes: { select: { status: true, amountCents: true } } } } }, take: 100 });
      const matches = clients.filter((client) => normalize(getClientDisplayName(client)).includes(normalize(entity)));
      if (matches.length !== 1) return NextResponse.json({ error: matches.length ? "Plusieurs clients correspondent. Précise le nom complet ou l’entreprise." : `Aucun client ne correspond à « ${entity} ».` }, { status: matches.length ? 409 : 404 });
      return NextResponse.json({ client: { id: matches[0].id, name: getClientDisplayName(matches[0]) }, financials: computeClientFinancialSummary(matches[0].invoices) });
    }

    if (type === "statistics") {
      const range = resolveStatisticsRange({ period: typeof body.period === "string" ? body.period : "month" });
      const dateWhere = { gte: range.start, lt: range.endExclusive };
      const [invoices, quotes, payments, purchases] = await Promise.all([
        prisma.invoice.findMany({ where: { organizationId, OR: [{ sentAt: dateWhere }, { sentAt: null, createdAt: dateWhere }] }, select: { id: true, quoteId: true, clientId: true, amountCents: true, status: true, createdAt: true, sentAt: true, payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } }, creditNotes: { select: { status: true, amountCents: true } } } }),
        prisma.quote.findMany({ where: { organizationId, OR: [{ sentAt: dateWhere }, { acceptedAt: dateWhere }] }, select: { id: true, amountCents: true, status: true, sentAt: true, acceptedAt: true, invoices: { select: { status: true } } } }),
        prisma.payment.findMany({ where: { organizationId, status: "SUCCEEDED", paidAt: dateWhere }, select: { id: true, invoiceId: true, amountCents: true, feeCents: true, refundedCents: true, status: true, paidAt: true, invoice: { select: { status: true, clientId: true, client: { select: { type: true, firstName: true, lastName: true, companyName: true } } } } } }),
        prisma.purchase.aggregate({ where: { organizationId, status: "ACTIVE", purchasedAt: dateWhere }, _sum: { totalAmountCents: true } }),
      ]);
      const stats = buildStatistics({ range, invoices, quotes, payments: payments.map((payment) => ({ ...payment, invoiceStatus: payment.invoice.status, clientId: payment.invoice.clientId, clientName: getClientDisplayName(payment.invoice.client) })) });
      return NextResponse.json({ range: { from: range.from, to: range.to }, metrics: { soldCents: stats.soldCents, billedCents: stats.billedCents, collectedCents: stats.collectedCents, remainingCents: stats.remainingCents, purchasesCents: purchases._sum.totalAmountCents ?? 0 } });
    }

    return NextResponse.json({ error: "Action Forge non prise en charge." }, { status: 400 });
  } catch (error) {
    const access = getWorkspaceErrorResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });
    console.error("FORGE ASSISTANT ACTION ERROR", error);
    return NextResponse.json({ error: "Forge ne peut pas exécuter cette action pour le moment." }, { status: 500 });
  }
}
