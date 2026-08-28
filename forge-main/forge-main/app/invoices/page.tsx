import Link from "next/link";

import FixedForgeBar from "@/components/FixedForgeBar";
import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";


function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}


function formatStatus(status: string) {
  const statuses: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    PAYEE: "Payée",
    EN_RETARD: "En retard",
    ANNULEE: "Annulée",
  };

  return statuses[status] ?? status;
}



export default async function InvoicesPage() {


  const currentUser =
    await requireCurrentUser();



  console.log(
    "AVANT RECHERCHE FACTURES",
    currentUser.id,
  );



  const invoices =
    await prisma.invoice.findMany({

      where: {
        client: {
          userId: currentUser.id,
        },
      },

      orderBy: {
        createdAt: "desc",
      },

    });



  console.log(
    "FACTURES TROUVEES :",
    invoices.length,
  );



  return (

    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 pb-56 dark:bg-slate-950 sm:px-6 sm:py-6">


      <div className="mt-6 space-y-4">


        {invoices.length === 0 ? (


          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">


            <p className="text-slate-500 dark:text-slate-400">
              Aucune facture créée.
            </p>


          </div>



        ) : (


          invoices.map((invoice) => (


            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              aria-label={`Ouvrir la facture ${invoice.reference}`}
              className="block min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 sm:p-6"
            >


              <h2 className="break-words text-lg font-bold text-blue-700 dark:text-blue-400 sm:text-xl">
                {invoice.title}
              </h2>



              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Facture {invoice.reference}
              </p>



              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {formatAmount(
                  invoice.amountCents,
                )}
              </p>



              <span className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {formatStatus(
                  invoice.status,
                )}
              </span>



            </Link>


          ))


        )}



      </div>


      <FixedForgeBar context="invoices" />



    </main>

  );
}
