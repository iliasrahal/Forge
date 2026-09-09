import Link from "next/link";
import { notFound } from "next/navigation";
import DocumentLineDetails from "@/components/DocumentLineDetails";

import SendInvoiceButton from "@/components/SendInvoiceButton";
import InvoiceAmountForm from "@/components/InvoiceAmountForm";
import InvoicePaymentsPanel from "@/components/InvoicePaymentsPanel";

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
  computeDocumentMargin,
  formatQuantity,
  formatUnit,
} from "@/src/lib/document-lines";
import {
  displayDocumentReference,
  isDraftReference,
} from "@/src/lib/document-numbering";
import {
  canCreateCreditNote,
  CREDIT_NOTE_STATUS_LABELS,
  sumIssuedCreditsCents,
} from "@/src/lib/credit-notes";
import { statusChipClasses } from "@/src/lib/document-status-style";
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

        lines: { include: { details: { orderBy: { position: "asc" } } } },

        payments: {

          orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],

          include: {

            recordedByUser: {

              select: { firstName: true, lastName: true },

            },

          },

        },

        creditNotes: {

          orderBy: { createdAt: "asc" },

          select: {

            id: true,

            reference: true,

            status: true,

            amountCents: true,

          },

        },

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

  const paymentRows = invoice.payments.map((payment) => ({
    id: payment.id,
    provider: payment.provider as "STRIPE" | "MANUAL",
    status: payment.status as string,
    method: payment.method,
    amountCents: payment.amountCents,
    feeCents: payment.feeCents,
    refundedCents: payment.refundedCents,
    reference: payment.reference,
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
    createdAt: payment.createdAt.toISOString(),
    recordedByName: payment.recordedByUser
      ? `${payment.recordedByUser.firstName ?? ""} ${
          payment.recordedByUser.lastName ?? ""
        }`.trim() || null
      : null,
  }));

  const canRecordPayment =
    workspaceContext.permissions.canWrite &&
    invoice.status !== "BROUILLON" &&
    invoice.status !== "ANNULEE";

  const creditedCents = sumIssuedCreditsCents(invoice.creditNotes);
  const canAddCreditNote =
    workspaceContext.permissions.canWrite &&
    canCreateCreditNote(invoice.status) &&
    invoice.lines.length > 0 &&
    creditedCents < invoice.amountCents;




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

          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {invoice.title}
            </h1>
            <span className={statusChipClasses(invoice.status)}>
              {formatStatus(invoice.status)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>
              {isDraftReference(invoice.reference)
                ? "Brouillon — numéro attribué à l’émission"
                : `Facture ${invoice.reference}`}
            </span>
            {invoice.type !== "STANDARD" ? (
              <span className="inline-flex rounded-full border border-[var(--forge-border)] px-2.5 py-0.5 text-xs font-semibold text-[var(--forge-text-secondary)]">
                {invoice.type === "DEPOSIT"
                  ? "Acompte"
                  : invoice.type === "SITUATION"
                    ? `Situation${
                        invoice.situationProgressBp
                          ? ` · ${invoice.situationProgressBp / 100} %`
                          : ""
                      }`
                    : "Solde"}
              </span>
            ) : null}
          </div>


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
              invoice.discountBp,
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
        ) : invoice.lines.length === 0 ? (
          <InvoiceAmountForm
            invoiceId={invoice.id}
            amountCents={invoice.amountCents}
            editable={
              workspaceContext.permissions.canWrite &&
              invoice.status === "BROUILLON" &&
              invoice.type !== "DEPOSIT"
            }
          />
        ) : (
          <div className="mt-6 rounded-2xl bg-blue-50 p-5 dark:bg-blue-950">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Montant total
            </p>
            <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
              {formatEur(invoice.amountCents)}
            </p>
          </div>
        )}
        {!invoice.vatApplicable ? (
          <p className="mt-2 px-1 text-xs text-slate-500 dark:text-slate-400">
            {VAT_EXEMPTION_MENTION}
          </p>
        ) : null}

        {invoice.discountBp > 0 ? (
          <p className="mt-2 px-1 text-xs text-slate-500 dark:text-slate-400">
            Remise globale de{" "}
            {(invoice.discountBp / 100).toLocaleString("fr-FR")} % appliquée.
          </p>
        ) : null}

        {invoice.lines.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-500">Détail</p>
            <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 dark:divide-slate-700 dark:border-slate-700">
              {invoice.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                      {line.label || line.category}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatQuantity(line.quantityMilli)} {formatUnit(line.unit)} ×{" "}
                      {formatEur(line.unitPriceCents)}
                      {line.discountBp > 0
                        ? ` · −${(line.discountBp / 100).toLocaleString("fr-FR")} %`
                        : ""}
                    </span>
                    <DocumentLineDetails
                      details={line.details}
                      formatAmount={formatEur}
                    />
                  </div>
                  <span className="shrink-0 font-semibold text-slate-900 dark:text-white">
                    {formatEur(line.amountCents)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {invoice.lines.some((line) => line.costCents != null) ? (
          (() => {
            const m = computeDocumentMargin(
              invoice.lines.map((line) => ({
                quantityMilli: line.quantityMilli,
                unitPriceCents: line.unitPriceCents,
                discountBp: line.discountBp,
                costCents: line.costCents,
                amountCents: line.amountCents,
              })),
              invoice.discountBp,
            );
            const htRef = invoice.totalHtCents || invoice.amountCents;
            const pct = htRef > 0 ? (m.totalMarginCents / htRef) * 100 : null;
            return (
              <p className="mt-3 px-1 text-sm text-slate-600 dark:text-slate-300">
                Déboursé {formatEur(m.totalCostCents)} · Marge{" "}
                <span className="font-semibold">
                  {formatEur(m.totalMarginCents)}
                  {pct !== null
                    ? ` (${pct.toLocaleString("fr-FR", {
                        maximumFractionDigits: 1,
                      })} %)`
                    : ""}
                </span>
              </p>
            );
          })()
        ) : null}





        {invoice.status !== "BROUILLON" || paymentRows.length > 0 ? (
          <InvoicePaymentsPanel
            invoiceId={invoice.id}
            invoiceTtcCents={invoice.amountCents}
            canRecord={canRecordPayment}
            payments={paymentRows}
            creditedCents={creditedCents}
            retentionCents={invoice.retentionCents}
          />
        ) : null}

        {invoice.creditNotes.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-500">Avoirs</p>
            <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 dark:divide-slate-700 dark:border-slate-700">
              {invoice.creditNotes.map((creditNote) => (
                <Link
                  key={creditNote.id}
                  href={`/credit-notes/${creditNote.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="text-slate-800 dark:text-slate-100">
                    {displayDocumentReference(creditNote.reference)}
                    <span className="ml-2 text-xs text-slate-500">
                      {CREDIT_NOTE_STATUS_LABELS[creditNote.status] ??
                        creditNote.status}
                    </span>
                  </span>
                  <span className="font-semibold text-pink-600 dark:text-pink-400">
                    − {formatEur(creditNote.amountCents)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {canAddCreditNote ? (
          <Link
            href={`/invoices/${invoice.id}/credit-notes/new`}
            className="mt-4 block w-full rounded-2xl border border-pink-400/50 px-5 py-3 text-center font-semibold text-pink-600 transition hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-950/40"
          >
            Créer un avoir
          </Link>
        ) : null}





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

          {workspaceContext.permissions.canWrite &&
          invoice.status === "BROUILLON" &&
          invoice.type === "STANDARD" ? (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
            >
              Modifier la facture
            </Link>
          ) : null}


          {workspaceContext.permissions.canWrite ? (
            <SendInvoiceButton
              invoiceId={invoice.id}
              clientId={invoice.clientId}
              clientEmail={clientEmail}
              interventionId={invoice.interventionId}
            />
          ) : null}



          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            download={`facture-${invoice.reference}.pdf`}
            className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
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
