import Link from "next/link";
import { notFound } from "next/navigation";

import DeleteClientButton from "@/components/clients/DeleteClientButton";
import ClientHistoryTabs, {
  ClientHistoryCounters,
  ClientHistoryProvider,
  type ClientHistoryItem,
} from "@/components/clients/ClientHistoryTabs";
import FixedForgeBar from "@/components/FixedForgeBar";
import { requireCurrentUser } from "@/src/lib/auth";
import {
  formatInterventionDisplayStatus,
  getInterventionDisplayStatus,
} from "@/src/lib/intervention-display-status";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { buildInterventionHref } from "@/src/lib/intervention-navigation";
import { clientService } from "@/src/services/client.service";


type ClientPageProps = {
  params: Promise<{
    id: string;
  }>;
};


function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}


function formatDocumentStatus(status: string) {
  const statuses: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYE: "Envoyé",
    ENVOYEE: "Envoyée",
    ACCEPTE: "Accepté",
    REFUSE: "Refusé",

    PAYEE: "Payée",
    EN_RETARD: "En retard",
  };


  return statuses[status] ?? status;
}


export default async function ClientPage({
  params,
}: ClientPageProps) {

  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");

  const { id } = await params;


  if (!id) {
    notFound();
  }


  const client = await clientService.getById(
    id,
    workspaceContext.workspace.id,
  );


  if (!client) {
    notFound();
  }



  const interventions: ClientHistoryItem[] = client.interventions.map(
      (intervention) => ({
        id: intervention.id,
        href: buildInterventionHref(intervention.id, "client", client.id),
        title: intervention.title,
        date: formatDate(intervention.scheduledAt),
        status: formatInterventionDisplayStatus(
          getInterventionDisplayStatus(
            intervention.status,
            intervention.scheduledAt,
          ),
        ),
      }),
    );

  const quotes: ClientHistoryItem[] = client.quotes.map(
      (quote) => ({
        id: quote.id,
        href: `/clients/${client.id}/quotes/${quote.id}`,
        title: quote.title,
        reference: quote.reference,
        date: formatDate(quote.createdAt),
        amount: formatAmount(quote.amountCents),
        status: formatDocumentStatus(quote.status),
      }),
    );

  const invoices: ClientHistoryItem[] = client.invoices.map(
      (invoice) => ({
        id: invoice.id,
        href: `/invoices/${invoice.id}`,
        title: invoice.title,
        reference: invoice.reference,
        date: formatDate(invoice.createdAt),
        amount: formatAmount(invoice.amountCents),
        status: formatDocumentStatus(invoice.status),
      }),
    );



  const name =
    client.type === "PARTICULIER"
      ? `${client.firstName ?? ""} ${
          client.lastName ?? ""
        }`.trim()
      : client.companyName ??
        "Client professionnel";



  return (
    <main className="min-h-dvh px-4 py-6 pb-36 sm:px-6 sm:py-10">


      <section className="mx-auto max-w-3xl">


        <Link
          href="/clients"
          aria-label="Retour à la liste des clients"
          className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>
            Retour
          </span>

        </Link>



        <div className="mt-4">

          <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {name}
          </h1>


          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {client.type === "PARTICULIER"
              ? "Client particulier"
              : "Client professionnel"}
          </p>

        </div>



        <ClientHistoryProvider
          interventions={interventions}
          quotes={quotes}
          invoices={invoices}
        >
        <div className="forge-surface mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">


          <div className="rounded-2xl bg-slate-50 p-4 text-slate-700 dark:bg-slate-800 dark:text-slate-300">


            {client.phone ? (
              <a
                href={`tel:${client.phone}`}
                className="block text-center font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400"
              >
                {client.phone}
              </a>
            ) : (
              <p className="text-center text-base text-slate-500 dark:text-slate-400">
                Aucun téléphone renseigné.
              </p>
            )}



            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">

              {client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="block break-all text-center font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400"
                >
                  {client.email}
                </a>
              ) : (
                <p className="text-center text-base text-slate-500 dark:text-slate-400">
                  Aucun e-mail renseigné.
                </p>
              )}

            </div>

          </div>




          <ClientHistoryCounters />




          {workspaceContext.permissions.canWrite ? (
          <div className="mt-6">

            <div className="grid gap-3 sm:grid-cols-2">


              <Link
                href={`/clients/${client.id}/interventions/new`}
                className="rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-blue-700"
              >
                Nouvelle intervention
              </Link>


              <Link
                href={`/clients/${client.id}/quotes/new`}
                className="rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-blue-700"
              >
                Nouveau devis
              </Link>


              <Link
                href={`/clients/${client.id}/invoices/new`}
                className="rounded-2xl border border-blue-600 px-5 py-4 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 sm:col-span-2"
              >
                Nouvelle facture
              </Link>


            </div>


            <Link
              href={`/clients/${client.id}/edit`}
              className="mt-3 block w-full rounded-2xl border border-slate-200 px-5 py-3 text-center font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              Modifier les informations
            </Link>


            <DeleteClientButton
              clientId={client.id}
            />


          </div>
          ) : null}


        </div>




        {client.notes && (

          <div className="mt-6 rounded-2xl border border-slate-100 p-4 dark:border-slate-700">

            <h2 className="font-semibold text-blue-700 dark:text-blue-400">
              Notes
            </h2>


            <p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-300">
              {client.notes}
            </p>

          </div>

        )}

        <ClientHistoryTabs />

        </ClientHistoryProvider>





      </section>



      <FixedForgeBar
        context="clients"
        clientId={client.id}
        clientName={name}
      />


    </main>
  );
}
