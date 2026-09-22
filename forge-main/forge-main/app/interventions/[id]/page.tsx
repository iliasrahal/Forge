import Link from "next/link";
import { notFound } from "next/navigation";


import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import {
  formatInterventionDisplayStatus,
  getInterventionDisplayStatus,
} from "@/src/lib/intervention-display-status";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import AssignmentSelect from "@/components/team/AssignmentSelect";
import InterventionDayPlanning from "@/components/InterventionDayPlanning";
import InterventionDetailActions from "@/components/InterventionDetailActions";
import { listInterventionDateKeys } from "@/src/lib/intervention-day-tasks";
import { formatParisDateKey } from "@/src/lib/paris-datetime";
import { computeInterventionProfitability } from "@/src/lib/intervention-profitability";
import InterventionProfitability from "@/components/InterventionProfitability";
import DeleteInterventionButton from "@/components/DeleteInterventionButton";
import { getInterventionReturnHref } from "@/src/lib/intervention-navigation";
import { computeInterventionProgress } from "@/src/lib/intervention-progress";
import InterventionOperations from "@/components/InterventionOperations";
import { getInterventionTerminology } from "@/src/lib/intervention-terminology";


type InterventionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    from?: string;
    clientId?: string;
  }>;
};


function formatDate(date: Date) {
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date);

  return timeLabel === "00:00" || timeLabel === "23:59"
    ? dateLabel
    : `${dateLabel} à ${timeLabel}`;
}


function getStatusClasses(status: string) {
  const classes: Record<string, string> = {
    PLANIFIEE:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",

    PASSEE:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",

    EN_COURS:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",

    TERMINEE:
      "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",

    ANNULEE:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  };


  return (
    classes[status] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  );
}


export default async function InterventionPage({
  params,
  searchParams,
}: InterventionPageProps) {
  const { id } = await params;
  const { from, clientId: requestedClientId } = await searchParams;
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");


  if (!id) {
    notFound();
  }


  const intervention =
    await prisma.intervention.findFirst({
      where: {
        id,
        organizationId: workspaceContext.workspace.id,
      },
      include: {
        client: true,
        assignments: { select: { userId: true } },
        dayAssignments: { select: { userId: true, date: true } },
        dayTasks: { include: { assignedTo: { select: { firstName: true, lastName: true } } }, orderBy: [{ date: "asc" }, { position: "asc" }] },
        dayStates: { orderBy: { date: "asc" } },
        excludedDays: { orderBy: { date: "asc" } },
        quote: { select: { id: true, clientId: true, reference: true, status: true, amountCents: true, totalCostCents: true, lines: { select: { lineType: true, quantityMilli: true, unit: true, costCents: true } } } },
        invoices: {
          where: { organizationId: workspaceContext.workspace.id },
          select: { id: true, reference: true, type: true, status: true, amountCents: true, payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } }, creditNotes: { select: { id: true, reference: true, status: true, amountCents: true } } },
        },
        expenses: {
          where: { organizationId: workspaceContext.workspace.id },
          orderBy: { expenseDate: "desc" },
        },
        workTimes: {
          where: { organizationId: workspaceContext.workspace.id },
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { startedAt: "desc" },
        },
        materialUsages: { orderBy: { createdAt: "desc" } },
        purchaseAllocations: { where: { organizationId: workspaceContext.workspace.id }, select: { amountCents: true, lineType: true, materialUsageId: true } },
        purchases: { where: { organizationId: workspaceContext.workspace.id, status: "ACTIVE" }, include: { supplier: { select: { name: true, companyName: true } }, lines: { include: { allocations: { select: { quantityMilli: true } } } }, _count: { select: { lines: true } } }, orderBy: { purchasedAt: "desc" } },
      },
    });


  if (!intervention) {
    notFound();
  }

  const terminology = getInterventionTerminology({
    startDateKey: formatParisDateKey(intervention.scheduledAt),
    endDateKey: intervention.endDate
      ? formatParisDateKey(intervention.endDate)
      : null,
    plannedDateKeys: intervention.dayTasks
      .filter((task) => task.date)
      .map((task) => formatParisDateKey(task.date!)),
  });

  const returnHref = getInterventionReturnHref({
    context: from,
    requestedClientId,
    interventionClientId: intervention.clientId,
    interventionId: intervention.id,
  });

  const displayStatus = getInterventionDisplayStatus(
    intervention.status,
    intervention.scheduledAt,
  );

  const teamMembers = workspaceContext.workspace.type === "TEAM"
    ? await prisma.organizationMember.findMany({
        where: { organizationId: workspaceContext.workspace.id },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const currentMembership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: workspaceContext.user.id, organizationId: workspaceContext.workspace.id } },
    select: { hourlyCostCents: true },
  });
  const materials = await prisma.materialCatalogItem.findMany({
    where: { active: true },
    select: { id: true, name: true, brand: true, reference: true, unit: true, defaultPurchasePriceCents: true },
    orderBy: { name: "asc" },
    take: 200,
  });
  const progress = computeInterventionProgress({
    explicitProgressBp: intervention.progressBp,
    tasks: intervention.dayTasks,
    days: intervention.dayStates,
  });

  const profitability = computeInterventionProfitability({
    quote: intervention.quote,
    invoices: intervention.invoices,
    expenses: intervention.expenses,
    workTimes: intervention.workTimes.map((entry) => ({
      userId: entry.userId,
      memberName: `${entry.user.firstName} ${entry.user.lastName ?? ""}`.trim(),
      durationMinutes: entry.durationMinutes,
      hourlyCostCents: entry.hourlyCostCents,
    })),
    materialUsages: intervention.materialUsages,
    purchaseAllocations: intervention.purchaseAllocations,
  });
  const dailyTracking = Array.from(new Set([
    ...intervention.expenses.map((entry) => formatParisDateKey(entry.dayDate ?? entry.expenseDate)),
    ...intervention.workTimes.map((entry) => formatParisDateKey(entry.dayDate ?? entry.startedAt)),
  ])).map((date) => ({
    date,
    hasExpenses: intervention.expenses.some((entry) => formatParisDateKey(entry.dayDate ?? entry.expenseDate) === date),
    hasWorkTimes: intervention.workTimes.some((entry) => formatParisDateKey(entry.dayDate ?? entry.startedAt) === date),
    expenseCents: intervention.expenses.filter((entry) => formatParisDateKey(entry.dayDate ?? entry.expenseDate) === date).reduce((sum, entry) => sum + entry.amountCents, 0),
    durationMinutes: intervention.workTimes.filter((entry) => formatParisDateKey(entry.dayDate ?? entry.startedAt) === date).reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0),
  }));


  const clientName = !intervention.client
    ? "Client à renseigner"
    : intervention.client.type === "PARTICULIER"
      ? `${intervention.client.firstName ?? ""} ${
          intervention.client.lastName ?? ""
        }`.trim()
      : intervention.client.companyName ??
        "Client professionnel";


  const clientAddress = [
    intervention.client?.street,
    [
      intervention.client?.postalCode,
      intervention.client?.city,
    ]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");


  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-6 pb-36">

      <section className="p-2 sm:p-6">


        <Link
          href={returnHref}
          className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>
            Retour
          </span>
        </Link>




        <div className="mx-auto mt-8 max-w-2xl text-center">

          <h1 className="text-balance text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
            {intervention.title || terminology.title}
          </h1>


          <p className="mt-3 text-lg font-semibold text-blue-700 dark:text-blue-400">
            {clientName}
          </p>


          {clientAddress && (
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              {clientAddress}
            </p>
          )}

        </div>

        <InterventionDetailActions
          interventionId={intervention.id}
          status={intervention.status}
          canWrite={workspaceContext.permissions.canWrite}
          terminology={terminology}
        />

        {teamMembers.length > 0 && (
          <AssignmentSelect
            interventionId={intervention.id}
            initialUserIds={intervention.assignments.length ? intervention.assignments.map((assignment) => assignment.userId) : intervention.assignedToId ? [intervention.assignedToId] : []}
            disabled={!workspaceContext.permissions.canWrite}
            members={teamMembers.map((member) => ({
              id: member.userId,
              name: `${member.user.firstName} ${member.user.lastName ?? ""}`.trim(),
            }))}
          />
        )}




        <div className="mx-auto mt-7 flex max-w-lg flex-wrap items-stretch justify-center gap-3">


          <div className="min-w-44 rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-3.5 text-center shadow-[0_16px_40px_-32px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-800/55 dark:shadow-black/30">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {terminology.isMultiDay ? "Période" : "Date"}
            </p>


            <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(
                intervention.scheduledAt,
              )}
              {intervention.endDate ? ` → ${formatDate(intervention.endDate)}` : ""}
            </p>

          </div>

          <div className="min-w-44 rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-3.5 text-center shadow-[0_16px_40px_-32px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-800/55 dark:shadow-black/30">
            <p className="text-sm text-slate-500 dark:text-slate-400">Progression</p>
            <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{progress ? `${progress.percent} %` : "À renseigner"}</p>
            {progress && <div className="mx-auto mt-2 h-2 max-w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-pink-500" style={{ width: `${progress.percent}%` }} /></div>}
          </div>




          <div className="min-w-44 rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-3.5 text-center shadow-[0_16px_40px_-32px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-800/55 dark:shadow-black/30">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Statut
            </p>


            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusClasses(
                displayStatus,
              )}`}
            >
              {formatInterventionDisplayStatus(displayStatus)}
            </span>

          </div>


        </div>





        {intervention.description && (

          <div className="mx-auto mt-7 max-w-2xl rounded-2xl border border-slate-200/70 bg-white/55 p-5 text-center dark:border-slate-700 dark:bg-slate-800/35">

            <h2 className="font-semibold text-blue-700 dark:text-blue-400">
              Description initiale
            </h2>


            <p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-300">
              {intervention.description}
            </p>


          </div>

        )}

        <InterventionOperations
          interventionId={intervention.id}
          canWrite={workspaceContext.permissions.canWrite}
          progressPercent={progress?.percent ?? null}
          progressSource={progress?.source ?? null}
          generalTasks={intervention.dayTasks.filter((task) => !task.date).map((task) => ({
            id: task.id, title: task.title, description: task.description, status: task.status,
            assignedToId: task.assignedToId,
            assigneeName: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName ?? ""}`.trim() : null,
          }))}
          members={teamMembers.map((member) => ({ id: member.userId, name: `${member.user.firstName} ${member.user.lastName ?? ""}`.trim() }))}
          materials={materials}
          purchaseLines={intervention.purchases.flatMap((purchase) => purchase.lines.map((line) => ({ id: line.id, name: line.name, brand: line.brand, reference: line.reference, unit: line.unit, unitPriceCents: line.unitPriceCents, availableQuantity: Math.max(0, line.quantityMilli - line.allocations.reduce((sum, allocation) => sum + allocation.quantityMilli, 0)) / 1000 }))).filter((line) => line.availableQuantity > 0)}
          usages={intervention.materialUsages.map((usage) => ({
            id: usage.id, name: usage.name, brand: usage.brand, reference: usage.reference,
            quantity: usage.quantityMilli / 1000, unit: usage.unit,
            actualUnitCostCents: usage.actualUnitCostCents, dayDate: usage.dayDate ? formatParisDateKey(usage.dayDate) : null,
          }))}
          terminology={terminology}
        />

        {(intervention.endDate || intervention.dayTasks.some((task) => task.date)) && (
          <InterventionDayPlanning
            interventionId={intervention.id}
            days={listInterventionDateKeys(
              intervention.scheduledAt,
              intervention.endDate,
              intervention.excludedDays.map((day) => formatParisDateKey(day.date)),
            )}
            tasks={intervention.dayTasks.filter((task) => task.date).map((task) => ({
              id: task.id,
              date: formatParisDateKey(task.date!),
              title: task.title,
              description: task.description,
              startTime: task.startTime,
              endTime: task.endTime,
              completedAt: task.completedAt?.toISOString() ?? null,
              status: task.status,
              report: task.report,
              assignedToId: task.assignedToId,
              assigneeName: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName ?? ""}`.trim() : null,
            }))}
            dayStates={intervention.dayStates.map((state) => ({
              date: formatParisDateKey(state.date),
              startedAt: state.startedAt?.toISOString() ?? null,
              completedAt: state.completedAt?.toISOString() ?? null,
              report: state.report,
              finalizationStep: state.finalizationStep,
            }))}
            dailyTracking={dailyTracking}
            members={teamMembers.map((member) => ({ id: member.userId, name: `${member.user.firstName} ${member.user.lastName ?? ""}`.trim() }))}
            dayAssignments={intervention.dayAssignments.map((assignment) => ({ date: formatParisDateKey(assignment.date), userId: assignment.userId }))}
            canWrite={workspaceContext.permissions.canWrite}
          />
        )}

        <InterventionProfitability
          interventionId={intervention.id}
          canWrite={workspaceContext.permissions.canWrite}
          hourlyCostCents={currentMembership?.hourlyCostCents ?? null}
          metrics={profitability}
          expenses={intervention.expenses.map((expense) => ({
            id: expense.id,
            date: formatParisDateKey(expense.expenseDate),
            dayDate: expense.dayDate ? formatParisDateKey(expense.dayDate) : null,
            amountCents: expense.amountCents,
            category: expense.category,
            supplier: expense.supplier,
            description: expense.description,
            note: expense.note,
          }))}
          workTimes={intervention.workTimes.map((entry) => ({
            id: entry.id,
            date: formatParisDateKey(entry.dayDate ?? entry.startedAt),
            startedAt: entry.startedAt.toISOString(),
            endedAt: entry.endedAt?.toISOString() ?? null,
            durationMinutes: entry.durationMinutes,
            hourlyCostCents: entry.hourlyCostCents,
            memberName: `${entry.user.firstName} ${entry.user.lastName ?? ""}`.trim(),
            isCurrentUser: entry.userId === workspaceContext.user.id,
            note: entry.note,
          }))}
          members={teamMembers.map((member) => ({ id: member.userId, name: `${member.user.firstName} ${member.user.lastName ?? ""}`.trim() }))}
          terminology={terminology}
        />

        <section className="mx-auto mt-8 max-w-2xl rounded-3xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Achats</h2>{workspaceContext.permissions.canWrite && <Link href={`/settings/purchases?interventionId=${intervention.id}`} className="rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300">+ Ajouter</Link>}</div>
          <div className="mt-4 space-y-2">{intervention.purchases.map((purchase)=><div key={purchase.id} className="rounded-2xl bg-white/55 p-3 text-sm dark:bg-slate-800/55"><p className="font-semibold">{purchase.supplier?.companyName || purchase.supplier?.name || purchase.supplierName || "Sans fournisseur"} · {(purchase.totalAmountCents/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"})}</p><p className="text-[var(--forge-text-muted)]">{formatParisDateKey(purchase.purchasedAt)} · {purchase._count.lines} ligne{purchase._count.lines>1?"s":""}</p></div>)}{!intervention.purchases.length && <p className="text-sm text-[var(--forge-text-muted)]">Aucun pour le moment.</p>}</div>
        </section>

        {(intervention.quote || intervention.invoices.length > 0) && <section id="documents" className="mx-auto mt-8 max-w-2xl scroll-mt-6 rounded-3xl border border-blue-200/70 bg-white/45 p-5 dark:border-blue-800/60 dark:bg-slate-900/35">
          <h2 className="text-center text-2xl font-bold text-slate-950 dark:text-white">Documents</h2>
          <div className="mt-4 grid gap-2">
            {intervention.quote && <Link href={`/clients/${intervention.quote.clientId ?? "unassigned"}/quotes/${intervention.quote.id}`} className="rounded-2xl bg-white/60 px-4 py-3 font-semibold text-blue-700 dark:bg-slate-800/50 dark:text-blue-300">Devis {intervention.quote.reference}</Link>}
            {intervention.invoices.map((invoice) => <div key={invoice.id} className="rounded-2xl bg-white/60 px-4 py-3 dark:bg-slate-800/50"><Link href={`/invoices/${invoice.id}`} className="font-semibold text-blue-700 dark:text-blue-300">{invoice.type === "DEPOSIT" ? "Acompte" : invoice.type === "SITUATION" ? "Situation" : invoice.type === "BALANCE" ? "Solde" : "Facture"} {invoice.reference}</Link>{invoice.creditNotes.map((credit) => <p key={credit.id} className="mt-1 text-sm text-slate-500">Avoir {credit.reference}</p>)}</div>)}
          </div>
        </section>}

        {workspaceContext.permissions.canWrite && (
          <div className="mx-auto mt-10 max-w-2xl border-t border-[var(--forge-border)] pt-6 text-center">
            <DeleteInterventionButton
              interventionId={intervention.id}
              hasHistory={
                intervention.status === "EN_COURS" ||
                intervention.status === "TERMINEE" ||
                Boolean(intervention.startedAt || intervention.finishedAt) ||
                intervention.workTimes.length > 0 ||
                intervention.expenses.length > 0 ||
                intervention.dayStates.length > 0 ||
                intervention.dayTasks.some((task) => Boolean(task.completedAt || task.report)) ||
                Boolean(intervention.reportIntervention || intervention.reportDiagnostic || intervention.reportTravaux || intervention.reportRecommendation)
              }
              hasFinancialDocuments={Boolean(intervention.quoteId || intervention.invoices.length > 0)}
              terminology={terminology}
            />
          </div>
        )}






        <div className="mx-auto mt-10 max-w-2xl text-center">


          <h2 className="text-2xl font-bold tracking-[-0.03em] text-blue-700 dark:text-blue-400">
            Compte rendu
          </h2>




          {intervention.reportIntervention ||
          intervention.reportDiagnostic ||
          intervention.reportTravaux ||
          intervention.reportRecommendation ? (

            <div className="mt-5 grid gap-3 sm:grid-cols-2">


              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 text-center shadow-[0_16px_40px_-34px_rgba(15,23,42,0.4)] dark:border-slate-700 dark:bg-slate-800/40">
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                  Intervention réalisée
                </h3>


                <p className="mt-2 whitespace-pre-line leading-7 text-slate-600 dark:text-slate-300">
                  {intervention.reportIntervention ||
                    "Non précisé"}
                </p>
              </div>



              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 text-center shadow-[0_16px_40px_-34px_rgba(15,23,42,0.4)] dark:border-slate-700 dark:bg-slate-800/40">
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                  Diagnostic
                </h3>


                <p className="mt-2 whitespace-pre-line leading-7 text-slate-600 dark:text-slate-300">
                  {intervention.reportDiagnostic ||
                    "Non précisé"}
                </p>
              </div>



              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 text-center shadow-[0_16px_40px_-34px_rgba(15,23,42,0.4)] dark:border-slate-700 dark:bg-slate-800/40">
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                  Travaux effectués
                </h3>


                <p className="mt-2 whitespace-pre-line leading-7 text-slate-600 dark:text-slate-300">
                  {intervention.reportTravaux ||
                    "Non précisé"}
                </p>
              </div>



              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 text-center shadow-[0_16px_40px_-34px_rgba(15,23,42,0.4)] dark:border-slate-700 dark:bg-slate-800/40">
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                  Recommandation
                </h3>


                <p className="mt-2 whitespace-pre-line leading-7 text-slate-600 dark:text-slate-300">
                  {intervention.reportRecommendation ||
                    "Aucune recommandation particulière."}
                </p>
              </div>


            </div>


          ) : (


            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Aucun compte rendu enregistré pour cette intervention.
              </p>

            </div>


          )}


        </div>





      </section>


    </main>
  );
}
