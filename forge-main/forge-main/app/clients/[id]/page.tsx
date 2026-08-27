import Link from "next/link";
import { notFound } from "next/navigation";

import DeleteClientButton from "@/components/clients/DeleteClientButton";
import FixedForgeBar from "@/components/FixedForgeBar";
import { requireCurrentUser } from "@/src/lib/auth";
import { clientService } from "@/src/services/client.service";


type ClientPageProps = {
  params: Promise<{
    id: string;
  }>;
};


type HistoryItem = {
  id: string;
  itemId: string;
  title: string;
  date: Date;
  type: "Intervention" | "Devis" | "Facture";
  status: string;
};


function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}


function formatStatus(status: string) {
  const statuses: Record<string, string> = {
    PLANIFIEE: "Planifiée",
    EN_COURS: "En cours",
    TERMINEE: "Terminée",
    ANNULEE: "Annulée",

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

  const currentUser = await requireCurrentUser();

  const { id } = await params;


  if (!id) {
    notFound();
  }


  const client = await clientService.getById(
    id,
    currentUser.id,
  );


  if (!client) {
    notFound();
  }



  const interventionCount =
    client.interventions.length;


  const quoteCount =
    client.quotes.length;


  const invoiceCount =
    client.invoices.length;



  const history: HistoryItem[] = [

    ...client.interventions.map(
      (intervention) => ({
        id: `intervention-${intervention.id}`,
        itemId: intervention.id,
        title: intervention.title,
        date: intervention.scheduledAt,
        type: "Intervention" as const,
        status: formatStatus(
          intervention.status,
        ),
      }),
    ),


    ...client.quotes.map(
      (quote) => ({
        id: `quote-${quote.id}`,
        itemId: quote.id,
        title: quote.title,
        date: quote.createdAt,
        type: "Devis" as const,
        status: formatStatus(
          quote.status,
        ),
      }),
    ),


    ...client.invoices.map(
      (invoice) => ({
        id: `invoice-${invoice.id}`,
        itemId: invoice.id,
        title: invoice.title,
        date: invoice.createdAt,
        type: "Facture" as const,
        status: formatStatus(
          invoice.status,
        ),
      }),
    ),

  ].sort(
    (firstItem, secondItem) =>
      secondItem.date.getTime() -
      firstItem.date.getTime(),
  );



  const name =
    client.type === "PARTICULIER"
      ? `${client.firstName ?? ""} ${
          client.lastName ?? ""
        }`.trim()
      : client.companyName ??
        "Client professionnel";



  return (
    <main className="min-h-screen bg-white px-6 py-10 dark:bg-slate-950">


      <section className="mx-auto max-w-3xl">


        <Link
          href="/clients"
          aria-label="Retour à la liste des clients"
          className="inline-flex items-center gap-2 text-base font-medium text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
        >

          <span className="text-xl">
            ←
          </span>

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



        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">


          <div className="rounded-2xl bg-slate-50 p-4 text-slate-700 dark:bg-slate-800 dark:text-slate-300">


            {client.phone ? (
              <a
                href={`tel:${client.phone}`}
                className="font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400"
              >
                {client.phone}
              </a>
            ) : (
              <p className="text-center text-base text-slate-500 dark:text-slate-400">
                Aucun téléphone renseigné.
              </p>
            )}



            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">


              <p className="text-center text-base text-slate-500 dark:text-slate-400">
                {client.street ||
                  "Aucune adresse renseignée"}
              </p>


              {(client.postalCode ||
                client.city) && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {client.postalCode}{" "}
                  {client.city}
                </p>
              )}

            </div>

          </div>




          <div className="mt-6 grid grid-cols-3 gap-3 border-y border-slate-100 py-5 text-center dark:border-slate-700">


            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {interventionCount}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Interventions
              </p>
            </div>



            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {quoteCount}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Devis
              </p>
            </div>



            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {invoiceCount}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Factures
              </p>
            </div>


          </div>




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





        <div className="mt-8">


          <h2 className="text-center text-lg font-semibold text-blue-700 dark:text-blue-400">
            Historique
          </h2>



          {history.length > 0 ? (

            <div className="mt-3 space-y-3">


              {history.map((item) => (

                <Link
                  key={item.id}
                  href={
                    item.type === "Devis"
                      ? `/clients/${client.id}/quotes/${item.itemId}`
                      : item.type === "Facture"
                        ? `/invoices/${item.itemId}`
                        : `/interventions/${item.itemId}`
                  }
                  className="block rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.5)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_22px_55px_-36px_rgba(37,99,235,0.35)] dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-black/30 dark:hover:border-blue-700"
                >


                  <div className="flex items-start justify-between gap-4">


                    <div>

                      <p className="font-semibold text-slate-800 dark:text-white">
                        {item.title}
                      </p>


                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {item.type} ·{" "}
                        {formatDate(item.date)}
                      </p>

                    </div>


                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900">
                      {item.status}
                    </span>


                  </div>


                </Link>

              ))}


            </div>


          ) : (


            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Aucun historique pour ce client.
              </p>

            </div>

          )}

        </div>


      </section>



      <FixedForgeBar
        context="clients"
        clientId={client.id}
        clientName={name}
      />


    </main>
  );
}
