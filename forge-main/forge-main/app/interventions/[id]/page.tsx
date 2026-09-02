import Link from "next/link";
import { notFound } from "next/navigation";


import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import AssignmentSelect from "@/components/team/AssignmentSelect";


type InterventionPageProps = {
  params: Promise<{
    id: string;
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


function formatStatus(status: string) {
  const statuses: Record<string, string> = {
    PLANIFIEE: "Planifiée",
    EN_COURS: "En cours",
    TERMINEE: "Terminée",
    ANNULEE: "Annulée",
  };


  return statuses[status] ?? status;
}


function getStatusClasses(status: string) {
  const classes: Record<string, string> = {
    PLANIFIEE:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",

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
}: InterventionPageProps) {
  const { id } = await params;
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
      },
    });


  if (!intervention) {
    notFound();
  }

  const teamMembers = workspaceContext.workspace.type === "TEAM"
    ? await prisma.organizationMember.findMany({
        where: { organizationId: workspaceContext.workspace.id },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];


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

      <section className="forge-surface rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">


        <Link
          href="/history"
          className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>
            Retour
          </span>
        </Link>




        <div className="mx-auto mt-8 max-w-2xl text-center">

          <h1 className="text-balance text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
            {intervention.title}
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
                intervention.status,
              )}`}
            >
              {formatStatus(
                intervention.status,
              )}
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
