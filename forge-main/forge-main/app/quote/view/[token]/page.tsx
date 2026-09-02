import { FileText } from "lucide-react";
import { notFound } from "next/navigation";

import ForgeLogo from "@/components/ForgeLogo";
import PublicQuoteAcceptance from "@/components/PublicQuoteAcceptance";
import { getPublicQuoteByToken } from "@/src/lib/public-quote";
import { getQuoteAcceptanceState } from "@/src/lib/quote-public-access";

type PublicQuotePageProps = {
  params: Promise<{ token: string }>;
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

export default async function PublicQuotePage({ params }: PublicQuotePageProps) {
  const { token } = await params;
  const access = await getPublicQuoteByToken(token);
  if (!access) notFound();

  const { quote } = access;
  const clientName =
    quote.client.type === "PROFESSIONNEL"
      ? quote.client.companyName || "Client professionnel"
      : `${quote.client.firstName ?? ""} ${quote.client.lastName ?? ""}`.trim() ||
        "Client";
  const acceptance = getQuoteAcceptanceState(quote.status);

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
                {quote.organization?.name || "Forge"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--forge-text-primary)]">
                {quote.title}
              </h1>
              <p className="mt-2 text-sm text-[var(--forge-text-secondary)]">
                Devis {quote.reference} · {formatDate(quote.createdAt)}
              </p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500/15 text-[var(--forge-accent-blue-lit)]">
              <FileText size={24} />
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--forge-text-muted)]">Client</p>
              <p className="mt-1 font-semibold text-[var(--forge-text-primary)]">{clientName}</p>
            </div>
            <div className="rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--forge-text-muted)]">Total</p>
              <p className="mt-1 text-2xl font-bold text-[var(--forge-accent-blue-lit)]">
                {formatAmount(quote.amountCents)}
              </p>
            </div>
          </section>

          {quote.description ? (
            <section className="mt-6">
              <h2 className="text-sm font-bold text-[var(--forge-text-primary)]">Description</h2>
              <p className="mt-2 whitespace-pre-line leading-7 text-[var(--forge-text-secondary)]">
                {quote.description}
              </p>
            </section>
          ) : null}

          <section className="mt-6">
            <h2 className="text-sm font-bold text-[var(--forge-text-primary)]">Détail du devis</h2>
            <div className="mt-3 divide-y divide-[var(--forge-border)] overflow-hidden rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)]">
              {quote.lines.map((line) => (
                <div key={line.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
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

          <div className="mt-7">
            <PublicQuoteAcceptance
              token={token}
              initialAccepted={acceptance.alreadyAccepted}
              initialSignature={quote.signature}
              canAccept={acceptance.canAccept}
              unavailableReason={acceptance.reason}
            />
          </div>
        </article>

        <p className="mt-5 text-center text-xs text-[var(--forge-text-muted)]">
          Consultation sécurisée du devis · Forge
        </p>
      </div>
    </main>
  );
}
