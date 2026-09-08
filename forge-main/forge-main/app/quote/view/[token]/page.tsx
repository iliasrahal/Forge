import ForgeLogo from "@/components/ForgeLogo";
import DocumentLineDetails from "@/components/DocumentLineDetails";
import PublicQuoteAcceptance from "@/components/PublicQuoteAcceptance";
import { getPublicQuoteByToken } from "@/src/lib/public-quote";
import { getQuoteIssuer } from "@/src/lib/quote-issuer";
import { getQuoteAcceptanceState } from "@/src/lib/quote-public-access";

type Props = { params: Promise<{ token: string }> };

function formatAmount(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default async function PublicQuotePage({ params }: Props) {
  const { token } = await params;
  const access = await getPublicQuoteByToken(token);

  if (!access) {
    return <main className="grid min-h-dvh place-items-center bg-transparent px-4"><section className="forge-surface w-full max-w-md rounded-3xl border p-6 text-center"><ForgeLogo size={64} /><h1 className="mt-5 text-2xl font-bold text-[var(--forge-text-primary)]">Lien invalide</h1><p className="mt-2 text-sm text-[var(--forge-text-secondary)]">Ce lien de signature n’est plus valide. Contactez l’émetteur du devis si nécessaire.</p></section></main>;
  }

  const { quote } = access;
  const acceptance = getQuoteAcceptanceState(quote.status);
  const issuer = getQuoteIssuer(quote.organization);
  const issuerName = issuer.companyName || issuer.fullName || quote.organization?.name || "Votre artisan";

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-transparent px-3 py-5 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(76,110,245,0.2),transparent_30%),radial-gradient(circle_at_88%_82%,rgba(255,111,165,0.14),transparent_30%)]" />
      <div className="mx-auto w-full max-w-xl">
        <header className="text-center"><ForgeLogo size={60} /><p className="mt-3 text-sm font-semibold text-[var(--forge-text-secondary)]">{issuerName}</p></header>
        <article className="forge-surface mt-4 rounded-[2rem] border p-4 shadow-xl sm:p-6">
          <div className="text-center"><p className="text-sm font-semibold text-[var(--forge-text-secondary)]">Devis n° {quote.reference}</p><h1 className="mt-2 text-2xl font-bold text-[var(--forge-text-primary)]">{quote.title}</h1><p className="mt-3 text-3xl font-extrabold text-[var(--forge-accent-blue-lit)]">{formatAmount(quote.amountCents)}</p></div>
          <div className="mt-6"><PublicQuoteAcceptance token={token} initialAccepted={acceptance.alreadyAccepted} initialSignature={quote.signature} canAccept={acceptance.canAccept} unavailableReason={acceptance.reason} /></div>
          <details className="mt-5 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)]">
            <summary className="cursor-pointer px-4 py-3 text-center text-sm font-semibold text-[var(--forge-text-primary)]">Voir le devis</summary>
            <div className="divide-y divide-[var(--forge-border)] border-t border-[var(--forge-border)]">{quote.lines.map((line) => <div key={line.id} className="px-4 py-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="min-w-0 break-words text-[var(--forge-text-primary)]">{line.label || line.category}</span><strong className="shrink-0 text-[var(--forge-text-primary)]">{formatAmount(line.amountCents)}</strong></div><DocumentLineDetails details={line.details} formatAmount={formatAmount} /></div>)}</div>
          </details>
        </article>
      </div>
    </main>
  );
}
