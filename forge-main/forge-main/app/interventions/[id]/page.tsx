import Link from "next/link";
import { notFound } from "next/navigation";


import { prisma } from "@/src/lib/prisma";


type InterventionPageProps = {
  params: Promise<{
    id: string;
  }>;
};


function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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


  if (!id) {
    notFound();
  }


  const intervention =
    await prisma.intervention.findUnique({
      where: {
        id,
      },
      include: {
        client: true,
      },
    });


  if (!intervention) {
    notFound();
  }


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
    <main className="mx-auto w-full max-w-3xl px-6 py-6 pb-36 dark:bg-slate-950">

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">


        <Link
          href="/history"
          className="inline-flex items-center gap-2 text-base font-medium text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <span className="text-xl">
            ←
          </span>

          <span>
            Retour historique
          </span>
        </Link>




        <div className="mt-6">

          <h1 className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-400">
            {intervention.title}
          </h1>


          <p className="mt-2 text-lg font-semibold text-blue-700 dark:text-blue-400">
            {clientName}
          </p>


          {clientAddress && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {clientAddress}
            </p>
          )}

        </div>




        <div className="mt-6 grid gap-3 sm:grid-cols-2">


          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Date
            </p>


            <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(
                intervention.scheduledAt,
              )}
            </p>

          </div>




          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">

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

          <div className="mt-6 rounded-2xl border border-slate-100 p-4 dark:border-slate-700">

            <h2 className="font-semibold text-blue-700 dark:text-blue-400">
              Description initiale
            </h2>


            <p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-300">
              {intervention.description}
            </p>


          </div>

        )}






        <div className="mt-8">


          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
            Compte rendu
          </h2>




          {intervention.reportIntervention ||
          intervention.reportDiagnostic ||
          intervention.reportTravaux ||
          intervention.reportRecommendation ? (

            <div className="mt-4 space-y-5">


              <div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                  Intervention réalisée
                </h3>


                <p className="mt-1 whitespace-pre-line text-slate-600 dark:text-slate-300">
                  {intervention.reportIntervention ||
                    "Non précisé"}
                </p>
              </div>



              <div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                  Diagnostic
                </h3>


                <p className="mt-1 whitespace-pre-line text-slate-600 dark:text-slate-300">
                  {intervention.reportDiagnostic ||
                    "Non précisé"}
                </p>
              </div>



              <div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                  Travaux effectués
                </h3>


                <p className="mt-1 whitespace-pre-line text-slate-600 dark:text-slate-300">
                  {intervention.reportTravaux ||
                    "Non précisé"}
                </p>
              </div>



              <div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                  Recommandation
                </h3>


                <p className="mt-1 whitespace-pre-line text-slate-600 dark:text-slate-300">
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
