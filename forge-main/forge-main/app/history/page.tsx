import Link from "next/link";


import FixedForgeBar from "@/components/FixedForgeBar";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";




export default async function HistoryPage() {
  const currentUser =
    await requireCurrentUser();




  const interventions =
    await prisma.intervention.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          { client: { userId: currentUser.id } },
        ],
        status: "TERMINEE",
      },



      include: {
        client: true,
      },



      orderBy: {
        updatedAt: "desc",
      },
    });




  return (
    <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-xl flex-col px-4 py-5 pb-40 dark:bg-slate-950 sm:px-6 sm:py-6">



      <div className="mb-6">
        <Link
          href="/clients"
          className="forge-back-link font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>
      </div>



      {interventions.length > 0 ? (
        <div className="space-y-3">



          {interventions.map((intervention) => {



            const clientName = intervention.client
              ? `${intervention.client.firstName ?? ""} ${
                  intervention.client.lastName ?? ""
                }`.trim()
              : "Client à renseigner";




            return (
              <Link
                key={intervention.id}
                href={`/interventions/${intervention.id}`}
                className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950"
              >



                <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                  {clientName || "Client"}
                </p>




                <p className="mt-2 font-medium text-slate-700 dark:text-slate-300">
                  {intervention.title}
                </p>




                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {new Date(
                    intervention.scheduledAt,
                  ).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>



              </Link>
            );
          })}



        </div>



      ) : (



        <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Aucun historique pour le moment.
        </div>



      )}





      <FixedForgeBar context="clients" />



    </main>
  );
}
