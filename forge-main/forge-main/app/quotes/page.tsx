import Link from "next/link";


import FixedForgeBar from "@/components/FixedForgeBar";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";



function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}



function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}



function formatStatus(status: string) {
  const statuses: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYE: "Envoyé",
    ACCEPTE: "Accepté",
    REFUSE: "Refusé",
  };


  return statuses[status] ?? status;
}



export default async function QuotesPage() {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");



  const quotes =
    await prisma.quote.findMany({
      where: {
        organizationId: workspaceContext.workspace.id,
      },


      include: {
        client: true,
      },


      orderBy: {
        createdAt: "desc",
      },
    });



  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 pb-56 dark:bg-slate-950 sm:px-6 sm:py-6">


      <div className="mb-6 grid gap-3 min-[380px]:grid-cols-2">



        <Link
          href="/quotes/new"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 sm:px-5"
        >
          + Nouveau devis
        </Link>




        <Link
          href="/quotes/stats"
          className="flex min-h-12 items-center justify-center rounded-2xl border border-blue-600 px-4 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 sm:px-5"
        >
          Statistiques devis
        </Link>



      </div>




      <div className="flex-1">


        {quotes.length > 0 ? (


          <div className="space-y-3">


            {quotes.map((quote) => {


              const clientName =
                quote.client.type ===
                "PARTICULIER"


                  ? `${quote.client.firstName ?? ""} ${
                      quote.client.lastName ?? ""
                    }`.trim()


                  : quote.client.companyName ??
                    "Client professionnel";



              return (


                <Link
                  key={quote.id}
                  href={`/clients/${quote.clientId}/quotes/${quote.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950"
                >


                  <div className="flex min-w-0 flex-col items-start gap-3 min-[380px]:flex-row min-[380px]:justify-between">



                    <div className="min-w-0">


                      <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                        {quote.title}
                      </p>



                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {quote.reference}
                      </p>



                      <p className="mt-3 text-sm font-semibold text-blue-700 dark:text-blue-400">
                        {clientName}
                      </p>



                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Créé le{" "}
                        {formatDate(
                          quote.createdAt,
                        )}
                      </p>



                    </div>




                    <div className="shrink-0 text-left min-[380px]:text-right">



                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(
                          quote.amountCents,
                        )}
                      </p>




                      <span className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">


                        {formatStatus(
                          quote.status,
                        )}


                      </span>



                    </div>



                  </div>



                </Link>


              );


            })}


          </div>


        ) : (


          <p className="text-center text-slate-500 dark:text-slate-400">
            Aucun devis créé.
          </p>


        )}


      </div>




      <FixedForgeBar context="quotes" />



    </main>
  );
}
