import Link from "next/link";

import { formatMarketplaceStatus, type MarketplacePublicPosting } from "@/src/lib/marketplace";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export default function MarketplaceCard({ posting, applicationCount, uniqueViewCount }: { posting: MarketplacePublicPosting; applicationCount?: number; uniqueViewCount?: number }) {
  const date = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return <article className="forge-surface flex h-full flex-col rounded-3xl border p-5">
    <div className="flex items-start justify-between gap-3"><div className="flex flex-wrap gap-1.5">{posting.trades.map((trade) => <span key={trade} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{trade}</span>)}</div><span className="shrink-0 text-xs font-semibold text-[var(--forge-text-muted)]">{formatMarketplaceStatus(posting.status)}</span></div>
    <h2 className="mt-4 text-xl font-bold text-[var(--forge-text-primary)]">{posting.title}</h2>
    <p className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400">{posting.location}</p>
    <p className="mt-2 text-sm text-[var(--forge-text-secondary)]">{date(posting.startDate)} → {date(posting.endDate)}</p>
    <p className="mt-1 text-sm text-[var(--forge-text-secondary)]">{posting.remainingPositions} place{posting.remainingPositions > 1 ? "s" : ""} disponible{posting.remainingPositions > 1 ? "s" : ""}{posting.budgetCents == null ? "" : ` · ${euro.format(posting.budgetCents / 100)}`}</p>
    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--forge-text-secondary)]">{posting.description}</p>
    <p className="mt-3 text-xs font-semibold text-[var(--forge-text-muted)]">{posting.publisher}{uniqueViewCount === undefined ? "" : ` · ${uniqueViewCount} vue${uniqueViewCount > 1 ? "s" : ""}`}{applicationCount === undefined ? "" : ` · ${applicationCount} demande${applicationCount > 1 ? "s" : ""}`} · {posting.remainingPositions} place{posting.remainingPositions > 1 ? "s" : ""} restante{posting.remainingPositions > 1 ? "s" : ""}</p>
    <Link href={`/marketplace/${posting.id}`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-300 px-4 font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300">Voir le chantier</Link>
  </article>;
}
