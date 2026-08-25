import Link from "next/link";
import { notFound } from "next/navigation";

import SendInvoiceButton from "@/components/SendInvoiceButton";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";



type InvoicePageProps = {
  params: Promise<{
    id: string;
  }>;
};



function formatAmount(amountCents: number) {

  return new Intl.NumberFormat(
    "fr-FR",
    {
      style: "currency",
      currency: "EUR",
    }
  ).format(amountCents / 100);

}



function formatDate(date: Date) {

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);

}



function formatStatus(status: string) {

  const statuses: Record<string,string> = {

    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    PAYEE: "Payée",
    EN_RETARD: "En retard",
    ANNULEE: "Annulée",

  };


  return statuses[status] ?? status;

}



export default async function InvoicePage({
  params,
}: InvoicePageProps) {


  const currentUser =
    await requireCurrentUser();



  const { id } =
    await params;



  const invoice =
    await prisma.invoice.findFirst({

      where: {

        id,

        client: {
          userId: currentUser.id,
        },

      },


      include: {

        client: true,

        quote: true,

      },

    });



  if (!invoice) {

    notFound();

  }



  const clientName =
    invoice.client.type === "PARTICULIER"

      ? `${invoice.client.firstName ?? ""} ${
          invoice.client.lastName ?? ""
        }`.trim()

      : invoice.client.companyName ??
        "Client professionnel";




  return (

    <main className="mx-auto w-full max-w-3xl px-6 py-6 dark:bg-slate-950">


      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">


        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-base font-medium text-slate-500 hover:text-blue-700"
        >

          ← Retour factures

        </Link>




        <div className="mt-6">


          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
            {invoice.title}
          </h1>


          <p className="mt-2 text-slate-500">
            Facture {invoice.reference}
          </p>


        </div>





        <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">


          <p className="text-sm text-slate-500">
            Client
          </p>


          <p className="mt-1 text-lg font-semibold text-blue-700">
            {clientName}
          </p>


        </div>





        <div className="mt-6 rounded-2xl bg-blue-50 p-5 dark:bg-blue-950">


          <p className="text-sm text-blue-700">
            Montant
          </p>


          <p className="mt-1 text-3xl font-bold text-blue-700">
            {formatAmount(
              invoice.amountCents
            )}
          </p>


        </div>





        <div className="mt-6">


          <p className="text-sm text-slate-500">
            Statut
          </p>


          <span className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">

            {formatStatus(
              invoice.status
            )}

          </span>


        </div>





        {invoice.description && (

          <div className="mt-6">


            <p className="text-sm text-slate-500">
              Description
            </p>


            <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">

              {invoice.description}

            </div>


          </div>

        )}




        <div className="mt-6 space-y-4 pt-5">


          <SendInvoiceButton
            invoiceId={invoice.id}
            clientId={invoice.clientId}
          />



          <p className="text-sm text-slate-500">

            Créée le {formatDate(invoice.createdAt)}

          </p>


        </div>



      </section>



    </main>

  );

}