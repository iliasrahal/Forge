import Link from "next/link";


import FixedForgeBar from "@/components/FixedForgeBar";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";



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
  const currentUser =
    await requireCurrentUser();



  const quotes =
    await prisma.quote.findMany({
      where: {
        client: {
          userId: currentUser.id,
        },
      },


      include: {
        client: true,
      },


      orderBy: {
        createdAt: "desc",
      },
    });



  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-6 dark:bg-slate-950">


      <div className="mb-6 flex gap-3">



        <Link
          href="/quotes/new"
          className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
        >
          + Nouveau devis
        </Link>




        <Link
          href="/quotes/stats"
          className="flex-1 rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
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


                  <div className="flex items-start justify-between gap-4">



                    <div>


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




                    <div className="shrink-0 text-right">



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