import Link from "next/link";
import { notFound } from "next/navigation";

import CreditNoteActions from "@/components/CreditNoteActions";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import {
  computeDocumentTotals,
  formatVatRateBp,
  VAT_EXEMPTION_MENTION,
} from "@/src/lib/vat";
import { formatQuantity, formatUnit } from "@/src/lib/document-lines";
import { displayDocumentReference } from "@/src/lib/document-numbering";
import {
  CREDIT_NOTE_MODE_LABELS,
  CREDIT_NOTE_STATUS_LABELS,
} from "@/src/lib/credit-notes";

type PageProps = { params: Promise<{ id: string }> };

function formatEur(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function CreditNotePage({ params }: PageProps) {
  await requireCurrentUser();
  const context = await requireWorkspaceContext("read");
  const { id } = await params;

  const creditNote = await prisma.creditNote.findFirst({
    where: { id, organizationId: context.workspace.id },
    include: {
      lines: { orderBy: { createdAt: "asc" } },
      invoice: { select: { id: true, reference: true } },
      client: true,
    },
  });

  if (!creditNote) notFound();

  const clientName =
    creditNote.client.type === "PARTICULIER"
      ? `${creditNote.client.firstName ?? ""} ${
          creditNote.client.lastName ?? ""
        }`.trim()
      : creditNote.client.companyName ?? "Client professionnel";

  const totals = computeDocumentTotals(
    creditNote.lines.map((line) => ({
      amountCents: line.amountCents,
      vatRateBp: line.vatRateBp,
    })),
    creditNote.vatApplicable,
    creditNote.discountBp,
  );

  const isDraft = creditNote.status === "BROUILLON";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-6">
      <section className="forge-surface rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <Link
          href={`/invoices/${creditNote.invoice.id}`}
          className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
        >
          Retour à la facture
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
            Avoir
          </h1>
          <span className="mt-3 inline-flex rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-600 dark:text-pink-300">
            {CREDIT_NOTE_MODE_LABELS[creditNote.mode] ?? creditNote.mode}
          </span>
          <p className="mt-2 text-slate-500">
            {isDraft
              ? "Brouillon — numéro attribué à l’émission"
              : `Avoir ${creditNote.reference}`}
            {" · "}sur facture{" "}
            <Link
              href={`/invoices/${creditNote.invoice.id}`}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {displayDocumentReference(creditNote.invoice.reference)}
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
          <p className="text-sm text-slate-500">Client</p>
          <p className="mt-1 text-lg font-semibold text-blue-700">
            {clientName}
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-pink-50 p-5 dark:bg-pink-950/40">
          <p className="text-sm text-pink-700 dark:text-pink-300">
            Montant de l’avoir (TTC)
          </p>
          <p className="mt-1 text-3xl font-bold text-pink-700 dark:text-pink-300">
            − {formatEur(creditNote.amountCents)}
          </p>
          {creditNote.vatApplicable ? (
            <dl className="mt-4 space-y-1.5 border-t border-pink-200/70 pt-4 text-sm text-pink-700 dark:border-pink-800 dark:text-pink-300">
              <div className="flex items-center justify-between">
                <dt>Total HT</dt>
                <dd className="font-semibold">
                  − {formatEur(totals.totalHtCents)}
                </dd>
              </div>
              {totals.byRate.map((entry) => (
                <div
                  key={entry.rateBp}
                  className="flex items-center justify-between"
                >
                  <dt>TVA {formatVatRateBp(entry.rateBp)}</dt>
                  <dd>− {formatEur(entry.vatCents)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-xs text-pink-700/80 dark:text-pink-300/80">
              {VAT_EXEMPTION_MENTION}
            </p>
          )}
        </div>

        {creditNote.reason ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-500">Motif</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
              {creditNote.reason}
            </p>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-500">Lignes créditées</p>
          <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 dark:divide-slate-700 dark:border-slate-700">
            {creditNote.lines.map((line) => (
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
                    {formatEur(line.unitPriceCents)}
                    {line.discountBp > 0
                      ? ` · −${(line.discountBp / 100).toLocaleString("fr-FR")} %`
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-slate-900 dark:text-white">
                  − {formatEur(line.amountCents)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-slate-500">Statut</p>
          <span className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            {CREDIT_NOTE_STATUS_LABELS[creditNote.status] ?? creditNote.status}
          </span>
          {creditNote.issuedAt ? (
            <p className="mt-2 text-sm text-slate-500">
              Émis le {formatDate(creditNote.issuedAt)}
            </p>
          ) : null}
        </div>

        <CreditNoteActions
          creditNoteId={creditNote.id}
          invoiceId={creditNote.invoice.id}
          status={creditNote.status}
          canWrite={context.permissions.canWrite}
        />

        {!isDraft ? (
          <a
            href={`/api/credit-notes/${creditNote.id}/pdf`}
            download={`avoir-${creditNote.reference}.pdf`}
            className="mt-3 block w-full rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
          >
            Télécharger l’avoir
          </a>
        ) : null}

        <p className="mt-6 text-sm text-slate-500">
          Créé le {formatDate(creditNote.createdAt)}
        </p>
      </section>
    </main>
  );
}
