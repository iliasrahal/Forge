import Link from "next/link";
import MarketplaceCard from "@/components/marketplace/MarketplaceCard";
import { buildMarketplacePublicPostingWhere, MARKETPLACE_TRADES, marketplacePublicPostingSelect, toMarketplacePublicPosting } from "@/src/lib/marketplace";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string; trade?: string | string[]; location?: string; from?: string; to?: string; page?: string }> }) {
  const context = await requireWorkspaceContext("read");
  const params = await searchParams;
  const page = Math.max(1, Math.min(100, Number(params.page) || 1));
  const take = 24;
  const selectedTrades = Array.isArray(params.trade) ? params.trade : params.trade ? [params.trade] : [];
  const where = buildMarketplacePublicPostingWhere({
    q: params.q,
    trades: selectedTrades,
    location: params.location,
    from: params.from,
    to: params.to,
  });
  const records = await prisma.marketplaceJobPosting.findMany({ where, select: marketplacePublicPostingSelect, orderBy: [{ startDate: "asc" }, { publishedAt: "desc" }], skip: (page - 1) * take, take: take + 1 });
  const postings = records.slice(0, take).map(toMarketplacePublicPosting);
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => (Array.isArray(value) ? value : [value]).forEach((item) => { if (typeof item === "string") query.append(key, item); }));

  return <main className="min-h-dvh px-4 py-6 pb-40 sm:px-6 lg:pb-16"><div className="mx-auto max-w-6xl">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Réseau privé Forge</p><h1 className="mt-2 text-3xl font-bold text-[var(--forge-text-primary)] sm:text-4xl">Chantiers</h1><p className="mt-2 text-[var(--forge-text-secondary)]">Trouvez un chantier ou du renfort parmi les artisans Forge.</p></div>{context.permissions.canWrite ? <Link href="/marketplace/new" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 font-semibold text-white">Publier un chantier</Link> : null}</header>
    <nav className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-2 text-center text-xs font-semibold sm:flex sm:text-sm"><Link href="/marketplace" className="rounded-xl bg-blue-600 px-3 py-2 text-white">Disponibles</Link><Link href="/marketplace/mine" className="rounded-xl px-3 py-2 text-blue-600">Mes annonces</Link><Link href="/marketplace/requests" className="rounded-xl px-3 py-2 text-blue-600">Mes demandes</Link></nav>
    <form className="forge-surface mt-5 grid gap-3 rounded-3xl border p-4 sm:grid-cols-2 lg:grid-cols-4"><input name="q" defaultValue={params.q} placeholder="Rechercher…" className="min-h-11 rounded-xl border bg-transparent px-3"/><input name="location" defaultValue={params.location} placeholder="Localisation" className="min-h-11 rounded-xl border bg-transparent px-3"/><div className="grid grid-cols-2 gap-2"><input name="from" type="date" defaultValue={params.from} aria-label="À partir du" className="min-w-0 rounded-xl border bg-transparent px-2"/><input name="to" type="date" defaultValue={params.to} aria-label="Jusqu’au" className="min-w-0 rounded-xl border bg-transparent px-2"/></div><button className="min-h-11 rounded-xl bg-blue-600 px-4 font-semibold text-white">Rechercher</button><fieldset className="sm:col-span-2 lg:col-span-4"><legend className="text-xs font-bold uppercase tracking-wide text-[var(--forge-text-muted)]">Métiers</legend><div className="mt-2 flex flex-wrap gap-2">{MARKETPLACE_TRADES.map((trade) => <label key={trade} className="flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold"><input type="checkbox" name="trade" value={trade} defaultChecked={selectedTrades.includes(trade)}/>{trade}</label>)}</div></fieldset></form>
    {postings.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{postings.map((posting) => <MarketplaceCard key={posting.id} posting={posting}/>)}</div> : <div className="mt-8 rounded-3xl border border-dashed border-[var(--forge-border)] p-10 text-center text-[var(--forge-text-secondary)]">Aucun chantier disponible pour le moment.</div>}
    <div className="mt-6 flex justify-center gap-3">{page > 1 ? <Link href={`/marketplace?${(() => { query.set("page", String(page - 1)); return query.toString(); })()}`} className="rounded-xl border px-4 py-2 font-semibold">Précédent</Link> : null}{records.length > take ? <Link href={`/marketplace?${(() => { query.set("page", String(page + 1)); return query.toString(); })()}`} className="rounded-xl border px-4 py-2 font-semibold">Suivant</Link> : null}</div>
  </div></main>;
}
