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
        dayTasks: { orderBy: [{ date: "asc" }, { position: "asc" }] },
        dayStates: { orderBy: { date: "asc" } },
        excludedDays: { orderBy: { date: "asc" } },
        quote: { select: { status: true, amountCents: true, totalCostCents: true } },
        invoices: {
          where: { organizationId: workspaceContext.workspace.id },
          select: { status: true, amountCents: true, payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } } },
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
      },
    });


  if (!intervention) {
    notFound();
  }

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

  const profitability = computeInterventionProfitability({
    quote: intervention.quote,
    invoices: intervention.invoices,
    expenses: intervention.expenses,
    workTimes: intervention.workTimes,
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
            {intervention.title || "Intervention"}
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
        />

        {workspaceContext.permissions.canWrite && teamMembers.length > 0 && (
          <AssignmentSelect
            interventionId={intervention.id}
            initialUserId={intervention.assignedToId}
            disabled={false}
            members={teamMembers.map((member) => ({
              id: member.userId,
              name: `${member.user.firstName} ${member.user.lastName ?? ""}`.trim(),
            }))}
          />
        )}




        <div className="mx-auto mt-7 flex max-w-lg flex-wrap items-stretch justify-center gap-3">


          <div className="min-w-44 rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-3.5 text-center shadow-[0_16px_40px_-32px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-800/55 dark:shadow-black/30">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {intervention.endDate ? "Période" : "Date"}
            </p>


            <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(
                intervention.scheduledAt,
              )}
              {intervention.endDate ? ` → ${formatDate(intervention.endDate)}` : ""}
            </p>

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

        {(intervention.endDate || intervention.dayTasks.length > 0) && (
          <InterventionDayPlanning
            interventionId={intervention.id}
            days={listInterventionDateKeys(
              intervention.scheduledAt,
              intervention.endDate,
              intervention.excludedDays.map((day) => formatParisDateKey(day.date)),
            )}
            tasks={intervention.dayTasks.map((task) => ({
              id: task.id,
              date: formatParisDateKey(task.date),
              title: task.title,
              description: task.description,
              startTime: task.startTime,
              endTime: task.endTime,
              completedAt: task.completedAt?.toISOString() ?? null,
              report: task.report,
            }))}
            dayStates={intervention.dayStates.map((state) => ({
              date: formatParisDateKey(state.date),
              startedAt: state.startedAt?.toISOString() ?? null,
              completedAt: state.completedAt?.toISOString() ?? null,
              report: state.report,
            }))}
            dailyTracking={dailyTracking}
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
          }))}
        />

        {workspaceContext.permissions.canWrite && (
          <div className="mx-auto mt-10 max-w-2xl border-t border-[var(--forge-border)] pt-6 text-center">
            <DeleteInterventionButton interventionId={intervention.id} />
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
