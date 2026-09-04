import DownloadQuotePdf from "@/components/DownloadQuotePdf";
import CreateDepositInvoice from "@/components/CreateDepositInvoice";
import QuoteReminderPanel from "@/components/QuoteReminderPanel";
import Link from "next/link";
import { notFound } from "next/navigation";


import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { getQuoteDepositSummary } from "@/src/lib/deposits";
import { getQuoteReminderState } from "@/src/lib/quote-reminders";
import {
  computeDocumentTotals,
  formatVatRateBp,
  VAT_EXEMPTION_MENTION,
} from "@/src/lib/vat";
import {
  computeDocumentMargin,
  formatQuantity,
  formatUnit,
} from "@/src/lib/document-lines";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";


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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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


  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");



  const { id, quoteId } =
    await params;



  const quote =
    await prisma.quote.findFirst({
      where: {
        id: quoteId,
        clientId: id,

        organizationId: workspaceContext.workspace.id,
      },
      include: {
        client: true,
        lines: true,
        invoices: {
          select: {
            type: true,
            status: true,
            amountCents: true,
          },
        },
        signature: {
          select: {
            signerFirstName: true,
            signerLastName: true,
            signedAt: true,
          },
        },
        reminders: {
          select: { id: true, sentAt: true, channel: true },
          orderBy: { sentAt: "desc" },
        },
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

  const depositSummary = getQuoteDepositSummary(
    quote.amountCents,
    quote.invoices,
  );
  const vatTotals = computeDocumentTotals(
    quote.lines.map((line) => ({
      amountCents: line.amountCents,
      vatRateBp: line.vatRateBp,
    })),
    quote.vatApplicable,
    quote.discountBp,
  );
  const marginInfo = quote.lines.some((line) => line.costCents != null)
    ? computeDocumentMargin(
        quote.lines.map((line) => ({
          quantityMilli: line.quantityMilli,
          unitPriceCents: line.unitPriceCents,
          discountBp: line.discountBp,
          costCents: line.costCents,
          amountCents: line.amountCents,
        })),
        quote.discountBp,
      )
    : null;
  const marginPercent =
    marginInfo && vatTotals.totalHtCents > 0
      ? (marginInfo.totalMarginCents / vatTotals.totalHtCents) * 100
      : null;
  const reminderState = getQuoteReminderState({
    status: quote.status,
    sentAt: quote.sentAt,
    reminders: quote.reminders,
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-6">


      <section className="forge-surface rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">



        <div>


          <Link
            href={`/clients/${id}`}
            aria-label="Retour au dossier client"
            className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
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

        {quote.status === "ACCEPTE" && quote.acceptedAt ? (
          <p className="mt-3 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Accepté le {formatDateTime(quote.acceptedAt)}
          </p>
        ) : null}

        {quote.signature ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center">
            <p className="font-bold text-emerald-700 dark:text-emerald-300">Accepté et signé</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Signé par {quote.signature.signerFirstName} {quote.signature.signerLastName}<br />
              le {formatDateTime(quote.signature.signedAt)}
            </p>
          </div>
        ) : null}

        {quote.status === "ENVOYE" || quote.reminders.length > 0 ? (
          <QuoteReminderPanel
            quoteId={quote.id}
            canWrite={workspaceContext.permissions.canWrite}
            canPrepare={quote.status === "ENVOYE"}
            hasEmail={Boolean(quote.client.email)}
            automaticLevel={reminderState.eligible ? reminderState.level : null}
            daysSinceActivity={reminderState.daysSinceActivity}
            reminders={quote.reminders}
          />
        ) : null}






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






        {quote.lines.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Détail
            </p>
            <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 dark:divide-slate-700 dark:border-slate-700">
              {quote.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                      {line.label || line.category}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatQuantity(line.quantityMilli)} {formatUnit(line.unit)} ×{" "}
                      {formatAmount(line.unitPriceCents)}
                      {line.discountBp > 0
                        ? ` · −${(line.discountBp / 100).toLocaleString("fr-FR")} %`
                        : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-slate-900 dark:text-white">
                    {formatAmount(line.amountCents)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}



        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950">



          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Montant {quote.vatApplicable ? "TTC" : null}
          </p>



          <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
            {formatAmount(quote.amountCents)}
          </p>

          {quote.vatApplicable ? (
            <dl className="mt-4 space-y-1.5 border-t border-blue-200/70 pt-4 text-sm text-blue-700 dark:border-blue-800 dark:text-blue-300">
              <div className="flex items-center justify-between">
                <dt>Total HT</dt>
                <dd className="font-semibold">
                  {formatAmount(vatTotals.totalHtCents)}
                </dd>
              </div>
              {vatTotals.byRate.map((entry) => (
                <div
                  key={entry.rateBp}
                  className="flex items-center justify-between text-blue-600/80 dark:text-blue-300/75"
                >
                  <dt>
                    TVA {formatVatRateBp(entry.rateBp)} sur{" "}
                    {formatAmount(entry.baseCents)}
                  </dt>
                  <dd>{formatAmount(entry.vatCents)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between font-bold">
                <dt>Total TVA</dt>
                <dd>{formatAmount(vatTotals.totalVatCents)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-xs text-blue-600/80 dark:text-blue-300/70">
              {VAT_EXEMPTION_MENTION}
            </p>
          )}

          {quote.discountBp > 0 ? (
            <p className="mt-2 text-xs text-blue-600/80 dark:text-blue-300/70">
              Remise globale de{" "}
              {(quote.discountBp / 100).toLocaleString("fr-FR")} % appliquée.
            </p>
          ) : null}

          {marginInfo ? (
            <p className="mt-3 border-t border-blue-200/70 pt-3 text-sm text-blue-800 dark:border-blue-800 dark:text-blue-200">
              Déboursé {formatAmount(marginInfo.totalCostCents)} · Marge{" "}
              <span className="font-semibold">
                {formatAmount(marginInfo.totalMarginCents)}
                {marginPercent !== null
                  ? ` (${marginPercent.toLocaleString("fr-FR", {
                      maximumFractionDigits: 1,
                    })} %)`
                  : ""}
              </span>
            </p>
          ) : null}

          {depositSummary.depositedCents > 0 ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-blue-200/70 pt-4 dark:border-blue-800">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-blue-600/80 dark:text-blue-300/80">
                  Acomptes
                </dt>
                <dd className="mt-1 font-bold text-blue-800 dark:text-blue-200">
                  {formatAmount(depositSummary.depositedCents)}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-xs font-semibold uppercase tracking-wide text-blue-600/80 dark:text-blue-300/80">
                  Reste
                </dt>
                <dd className="mt-1 font-bold text-blue-800 dark:text-blue-200">
                  {formatAmount(depositSummary.remainingCents)}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>






<div className="mt-6 flex flex-col gap-3">

  {workspaceContext.permissions.canWrite &&
  quote.status !== "REFUSE" &&
  depositSummary.remainingCents > 0 ? (
    <CreateDepositInvoice
      quoteId={quote.id}
      quoteTotalCents={quote.amountCents}
      alreadyDepositedCents={depositSummary.depositedCents}
    />
  ) : null}


  {workspaceContext.permissions.canWrite ? (
    <DownloadQuotePdf
      clientId={id}
      quoteId={quoteId}
    />
  ) : null}



  {workspaceContext.permissions.canWrite ? (<Link
    href={{
      pathname: `/clients/${id}/interventions/new`,
      query: {
        title: quote.title,
        ...(quote.description
          ? {
              description:
                quote.description,
            }
          : {}),
      },
    }}
    className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
  >
    Créer une intervention
  </Link>) : null}


  {workspaceContext.permissions.canWrite && quote.status !== "ACCEPTE" && !quote.signature ? (<Link
    href={`/clients/${id}/quotes/${quoteId}/edit`}
    className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
  >
    Modifier le devis
  </Link>) : null}


  <a
    href={`/api/quotes/${quoteId}/pdf`}
    download={`devis-${quote.reference}.pdf`}
    className="block w-full rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
  >
    Télécharger le devis
  </a>


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
