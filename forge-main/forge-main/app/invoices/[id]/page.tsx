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
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import {
  computeDocumentTotals,
  formatVatRateBp,
  VAT_EXEMPTION_MENTION,
} from "@/src/lib/vat";
import {
  isValidClientEmail,
  normalizeClientEmail,
} from "@/src/lib/client-email";


function formatEur(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}



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


  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");



  const { id } =
    await params;



  const invoice =
    await prisma.invoice.findFirst({

      where: {

        id,

        organizationId: workspaceContext.workspace.id,

      },


      include: {

        client: true,

        quote: true,

        intervention: true,

        lines: true,

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
  const clientEmail = isValidClientEmail(invoice.client.email)
    ? normalizeClientEmail(invoice.client.email)
    : null;




  return (

    <main className="mx-auto w-full max-w-3xl px-6 py-6">


      <section className="forge-surface rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">


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

          {invoice.type === "DEPOSIT" ? (
            <span className="mt-3 inline-flex rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-600 dark:text-pink-300">
              Facture d’acompte
            </span>
          ) : null}


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





        {invoice.vatApplicable ? (
          (() => {
            const vt = computeDocumentTotals(
              invoice.lines.map((line) => ({
                amountCents: line.amountCents,
                vatRateBp: line.vatRateBp,
              })),
              true,
            );
            return (
              <div className="mt-6 rounded-2xl bg-blue-50 p-5 dark:bg-blue-950">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Montant TTC
                </p>
                <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {formatEur(invoice.amountCents)}
                </p>
                <dl className="mt-4 space-y-1.5 border-t border-blue-200/70 pt-4 text-sm text-blue-700 dark:border-blue-800 dark:text-blue-300">
                  <div className="flex items-center justify-between">
                    <dt>Total HT</dt>
                    <dd className="font-semibold">{formatEur(vt.totalHtCents)}</dd>
                  </div>
                  {vt.byRate.map((entry) => (
                    <div
                      key={entry.rateBp}
                      className="flex items-center justify-between text-blue-600/80 dark:text-blue-300/75"
                    >
                      <dt>
                        TVA {formatVatRateBp(entry.rateBp)} sur{" "}
                        {formatEur(entry.baseCents)}
                      </dt>
                      <dd>{formatEur(entry.vatCents)}</dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between font-bold">
                    <dt>Total TVA</dt>
                    <dd>{formatEur(vt.totalVatCents)}</dd>
                  </div>
                </dl>
              </div>
            );
          })()
        ) : (
          <InvoiceAmountForm
            invoiceId={invoice.id}
            amountCents={invoice.amountCents}
            editable={
              workspaceContext.permissions.canWrite &&
              invoice.status === "BROUILLON" &&
              invoice.type !== "DEPOSIT"
            }
          />
        )}
        {!invoice.vatApplicable ? (
          <p className="mt-2 px-1 text-xs text-slate-500 dark:text-slate-400">
            {VAT_EXEMPTION_MENTION}
          </p>
        ) : null}





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
                    className="forge-surface-subtle rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
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

        {invoice.type === "DEPOSIT" && invoice.quote ? (
          <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
            <p className="text-sm text-[var(--forge-text-secondary)]">
              Devis associé
            </p>
            <Link
              href={`/clients/${invoice.clientId}/quotes/${invoice.quote.id}`}
              className="mt-1 inline-block font-semibold text-[var(--forge-accent-blue-lit)] hover:underline"
            >
              {invoice.quote.reference}
            </Link>
          </div>
        ) : null}




        <div className="mt-6 space-y-4 pt-5">


          {workspaceContext.permissions.canWrite ? (
            <SendInvoiceButton
              invoiceId={invoice.id}
              clientId={invoice.clientId}
              clientEmail={clientEmail}
            />
          ) : null}



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
