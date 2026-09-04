import { CheckCircle2, FileText } from "lucide-react";
import { notFound } from "next/navigation";

import ForgeLogo from "@/components/ForgeLogo";
import PublicInvoicePayment from "@/components/PublicInvoicePayment";
import { getPublicInvoiceByToken } from "@/src/lib/public-invoice";
import { computeInvoicePaymentState } from "@/src/lib/payments";
import { displayDocumentReference } from "@/src/lib/document-numbering";

type PublicInvoicePageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string }>;
};

function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function PublicInvoicePage({
  params,
  searchParams,
}: PublicInvoicePageProps) {
  const { token } = await params;
  const { paid, canceled } = await searchParams;
  const access = await getPublicInvoiceByToken(token);
  if (!access) notFound();

  const { invoice } = access;
  const clientName =
    invoice.client.type === "PROFESSIONNEL"
      ? invoice.client.companyName || "Client professionnel"
      : `${invoice.client.firstName ?? ""} ${invoice.client.lastName ?? ""}`.trim() ||
        "Client";

  const state = computeInvoicePaymentState(
    invoice.amountCents,
    invoice.payments,
  );
  const canPayOnline = Boolean(
    invoice.organization?.stripeChargesEnabled &&
      invoice.organization.stripeAccountId,
  );
  const settled = state.isFullyPaid || invoice.status === "PAYEE";
  const hasPendingTransfer = invoice.payments.some(
    (payment) => payment.status === "PENDING",
  );

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-transparent px-4 py-6 sm:px-6 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(76,110,245,0.2),transparent_30%),radial-gradient(circle_at_88%_82%,rgba(255,111,165,0.14),transparent_30%)]"
      />
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-center">
          <ForgeLogo size={72} />
        </header>

        <article className="forge-surface mt-5 rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 border-b border-[var(--forge-border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--forge-accent-blue-lit)]">
                {invoice.organization?.name || "Forge"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--forge-text-primary)]">
                {invoice.title}
              </h1>
              <p className="mt-2 text-sm text-[var(--forge-text-secondary)]">
                Facture {displayDocumentReference(invoice.reference)} ·{" "}
                {formatDate(invoice.createdAt)}
              </p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/15 text-[var(--forge-accent-blue-lit)]">
              <FileText size={24} />
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--forge-text-muted)]">
                Client
              </p>
              <p className="mt-1 font-semibold text-[var(--forge-text-primary)]">
                {clientName}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--forge-text-muted)]">
                {settled ? "Total" : "Reste à payer"}
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--forge-accent-blue-lit)]">
                {formatAmount(settled ? invoice.amountCents : state.remainingCents)}
              </p>
              {!settled && state.collectedCents > 0 ? (
                <p className="mt-1 text-xs text-[var(--forge-text-muted)]">
                  Déjà réglé {formatAmount(state.collectedCents)} sur{" "}
                  {formatAmount(invoice.amountCents)}
                </p>
              ) : null}
            </div>
          </section>

          {invoice.lines.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-sm font-bold text-[var(--forge-text-primary)]">
                Détail
              </h2>
              <div className="mt-3 divide-y divide-[var(--forge-border)] overflow-hidden rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)]">
                {invoice.lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center justify-between gap-4 px-4 py-3.5"
                  >
                    <span className="min-w-0 break-words text-[var(--forge-text-primary)]">
                      {line.label || line.category}
                    </span>
                    <strong className="shrink-0 text-[var(--forge-text-primary)]">
                      {formatAmount(line.amountCents)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {settled ? (
            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={20} />
              <p className="font-semibold">Cette facture est réglée. Merci !</p>
            </div>
          ) : hasPendingTransfer ? (
            <div className="mt-7 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-amber-700 dark:text-amber-300">
              <p className="font-semibold">Virement en attente de réception</p>
              <p className="mt-1 text-sm">
                Le virement a été initié. Le statut se met à jour dès que Stripe
                confirme la réception des fonds (1 à 2 jours ouvrés).
              </p>
            </div>
          ) : canPayOnline ? (
            <>
              {paid ? (
                <p className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                  Paiement pris en compte. La confirmation peut prendre quelques
                  instants.
                </p>
              ) : null}
              {canceled ? (
                <p className="mt-6 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] px-4 py-3 text-sm text-[var(--forge-text-secondary)]">
                  Paiement annulé. Tu peux réessayer ci-dessous.
                </p>
              ) : null}
              <PublicInvoicePayment
                token={token}
                remainingCents={state.remainingCents}
              />
            </>
          ) : (
            <p className="mt-7 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] px-4 py-4 text-sm text-[var(--forge-text-secondary)]">
              Le paiement en ligne n’est pas disponible pour cette facture.
              Merci de régler selon les modalités indiquées par l’artisan.
            </p>
          )}
        </article>

        <p className="mt-5 text-center text-xs text-[var(--forge-text-muted)]">
          Consultation sécurisée de la facture · Forge
        </p>
      </div>
    </main>
  );
}
