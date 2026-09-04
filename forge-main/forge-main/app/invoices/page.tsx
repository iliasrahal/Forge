import Link from "next/link";

import FixedForgeBar from "@/components/FixedForgeBar";
import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { displayDocumentReference } from "@/src/lib/document-numbering";


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


  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");



  const invoices =
    await prisma.invoice.findMany({

      where: {
        organizationId: workspaceContext.workspace.id,
      },

      orderBy: {
        createdAt: "desc",
      },

    });



  return (

    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 pb-56 sm:px-6 sm:py-6">

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/invoices/new"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 sm:px-5"
        >
          Nouvelle facture
        </Link>
        <Link
          href="/invoices/stats"
          className="flex min-h-12 items-center justify-center rounded-2xl border border-blue-600 px-4 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 sm:px-5"
        >
          Historique Factures
        </Link>
      </div>


      <div className="mt-6 space-y-4">


        {invoices.length === 0 ? (


          <div className="forge-surface rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">


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
              className="forge-surface block min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 sm:p-6"
            >


              <h2 className="break-words text-lg font-bold text-blue-700 dark:text-blue-400 sm:text-xl">
                {invoice.title}
              </h2>

              {invoice.type === "DEPOSIT" ? (
                <span className="mt-2 inline-flex rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-600 dark:text-pink-300">
                  Facture d’acompte
                </span>
              ) : null}



              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Facture {displayDocumentReference(invoice.reference)}
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
