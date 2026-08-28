import Link from "next/link";
import { notFound } from "next/navigation";

import SendInvoiceButton from "@/components/SendInvoiceButton";
import InvoiceAmountForm from "@/components/InvoiceAmountForm";

import { requireCurrentUser } from "@/src/lib/auth";
import {
  buildInvoiceDescriptionSections,
  parseInvoiceDescriptionSections,
} from "@/src/lib/invoiceDescription";
import { prisma } from "@/src/lib/prisma";



type InvoicePageProps = {
  params: Promise<{
    id: string;
  }>;
};



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

        intervention: true,

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

  const invoiceDescriptionSections =
    invoice.intervention
      ? buildInvoiceDescriptionSections(
          invoice.intervention,
        )
      : parseInvoiceDescriptionSections(
          invoice.description,
        );




  return (

    <main className="mx-auto w-full max-w-3xl px-6 py-6 dark:bg-slate-950">


      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">


        <Link
          href="/invoices"
          className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >

          Retour

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





        <InvoiceAmountForm
          invoiceId={invoice.id}
          amountCents={invoice.amountCents}
          editable={invoice.status === "BROUILLON"}
        />





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





        {invoiceDescriptionSections.length > 0 && (

          <div className="mt-6">


            <p className="text-sm font-semibold text-slate-500">
              Détail de l’intervention
            </p>


            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {invoiceDescriptionSections.map(
                ({ label, content }) => (
                  <section
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <h2 className="text-sm font-bold text-blue-700 dark:text-blue-400">
                      {label}
                    </h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {content}
                    </p>
                  </section>
                ),
              )}
            </div>


          </div>

        )}




        {invoice.intervention && (

          <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">

            <p className="text-sm text-slate-500">
              Intervention associée
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {invoice.intervention.title}
            </p>

          </div>

        )}




        <div className="mt-6 space-y-4 pt-5">


          <SendInvoiceButton
            invoiceId={invoice.id}
            clientId={invoice.clientId}
          />



          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            download={`facture-${invoice.reference}.pdf`}
            className="block w-full rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
          >
            Télécharger la facture
          </a>



          <p className="text-sm text-slate-500">

            Créée le {formatDate(invoice.createdAt)}

          </p>


        </div>



      </section>



    </main>

  );

}
