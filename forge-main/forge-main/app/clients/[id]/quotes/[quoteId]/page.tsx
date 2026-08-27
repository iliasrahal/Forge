import DownloadQuotePdf from "@/components/DownloadQuotePdf";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";


import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";


type QuotePageProps = {
  params: Promise<{
    id: string;
    quoteId: string;
  }>;
};


function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}


function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
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


export default async function QuotePage({
  params,
}: QuotePageProps) {


  const currentUser =
    await requireCurrentUser();



  const { id, quoteId } =
    await params;



  const quote =
    await prisma.quote.findFirst({
      where: {
        id: quoteId,
        clientId: id,

        client: {
          userId: currentUser.id,
        },
      },
      include: {
        client: true,
        lines: true,
      },
    });



  if (!quote) {
    notFound();
  }



  const clientName =
    quote.client.type === "PARTICULIER"
      ? `${quote.client.firstName ?? ""} ${
          quote.client.lastName ?? ""
        }`.trim()
      : quote.client.companyName ??
        "Client professionnel";



  async function createInterventionFromQuote() {
    "use server";

    const actionUser =
      await requireCurrentUser();

    const sourceQuote =
      await prisma.quote.findFirst({
        where: {
          id: quoteId,
          clientId: id,
          client: {
            userId: actionUser.id,
          },
        },
        select: {
          title: true,
          description: true,
          clientId: true,
        },
      });

    if (!sourceQuote) {
      notFound();
    }

    const intervention =
      await prisma.intervention.create({
        data: {
          clientId: sourceQuote.clientId,
          title: sourceQuote.title,
          description: sourceQuote.description,
          scheduledAt: new Date(),
        },
      });

    redirect(
      `/app?newIntervention=${intervention.id}`,
    );
  }



  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-6 dark:bg-slate-950">


      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">



        <div>


          <Link
            href={`/clients/${id}`}
            aria-label="Retour au dossier client"
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
              {quote.title}
            </h1>



            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Devis {quote.reference}
            </p>


          </div>



        </div>





        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">



          <div>


            <p className="text-sm text-slate-500 dark:text-slate-400">
              Client
            </p>



            <p className="mt-1 font-semibold text-blue-700 dark:text-blue-400">
              {clientName}
            </p>


          </div>




          <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {formatStatus(quote.status)}
          </span>



        </div>






        <div className="mt-6">


          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Description
          </p>



          <div className="mt-2 rounded-2xl border border-slate-100 p-4 dark:border-slate-700">


            <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">
              {quote.description ||
                "Aucune description renseignée."}
            </p>



          </div>



        </div>






        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950">



          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Montant
          </p>



          <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
            {formatAmount(quote.amountCents)}
          </p>
        </div>






<div className="mt-6 flex flex-col gap-3">


  <Link
    href={`/clients/${id}/quotes/${quoteId}/edit`}
    className="block w-full rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
  >
    Modifier le devis
  </Link>



  <DownloadQuotePdf
    pdfUrl={`/api/quotes/${quoteId}/pdf`}
    clientId={id}
    quoteId={quoteId}
    fileName={`devis-${quote.reference}.pdf`}
  />



  <form action={createInterventionFromQuote}>
    <button
      type="submit"
      className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
    >
      Créer une intervention
    </button>
  </form>


</div>






        <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">



          <p className="text-sm text-slate-500 dark:text-slate-400">
            Créé le {formatDate(quote.createdAt)}
          </p>



        </div>




      </section>



    </main>
  );
}
