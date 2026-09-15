import Link from "next/link";

import RevenueChart from "@/components/statistics/RevenueChart";
import StatisticsFilters from "@/components/statistics/StatisticsFilters";
import { getClientDisplayName } from "@/src/lib/client-name";
import { prisma } from "@/src/lib/prisma";
import { buildStatistics, resolveStatisticsRange } from "@/src/lib/statistics";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

type PageProps = { searchParams: Promise<{ period?: string; from?: string; to?: string }> };

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const formatMoney = (cents: number) => money.format(cents / 100);
const formatRate = (rate: number | null) => rate == null ? "—" : `${rate} %`;

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="forge-surface min-w-0 rounded-2xl border border-[var(--forge-border)] p-4 sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--forge-text-muted)]">{label}</p>
      <p className="forge-num mt-2 truncate text-2xl font-bold text-[var(--forge-text-primary)] sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-[var(--forge-text-muted)]">{hint}</p>
    </article>
  );
}

function Distribution({ values }: { values: Array<{ label: string; value: number; color: string }> }) {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="mt-5">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-700/60">
        {values.map((item) => item.value ? <span key={item.label} className={item.color} style={{ width: `${item.value / total * 100}%` }} /> : null)}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {values.map((item) => <div key={item.label}><p className="forge-num text-lg font-bold text-[var(--forge-text-primary)]">{item.value}</p><p className="text-xs text-[var(--forge-text-muted)]">{item.label}</p></div>)}
      </div>
    </div>
  );
}

export default async function StatisticsPage({ searchParams }: PageProps) {
  const workspace = await requireWorkspaceContext("read");
  const query = await searchParams;
  const range = resolveStatisticsRange(query);
  const dateWhere = { gte: range.start, lt: range.endExclusive };

  const [invoices, quotes, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId: workspace.workspace.id, createdAt: dateWhere },
      select: {
        id: true, quoteId: true, clientId: true, amountCents: true, status: true, createdAt: true,
        payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } },
        creditNotes: { select: { status: true, amountCents: true } },
      },
    }),
    prisma.quote.findMany({
      where: { organizationId: workspace.workspace.id, sentAt: dateWhere },
      select: {
        id: true, amountCents: true, status: true, sentAt: true,
        invoices: { select: { status: true } },
      },
    }),
    prisma.payment.findMany({
      where: { organizationId: workspace.workspace.id, status: "SUCCEEDED", paidAt: dateWhere },
      select: {
        id: true, invoiceId: true, amountCents: true, feeCents: true, refundedCents: true, status: true, paidAt: true,
        invoice: {
          select: {
            status: true, clientId: true,
            client: { select: { type: true, firstName: true, lastName: true, companyName: true } },
          },
        },
      },
    }),
  ]);

  const stats = buildStatistics({
    range,
    invoices,
    quotes,
    payments: payments.map((payment) => ({
      id: payment.id,
      invoiceId: payment.invoiceId,
      invoiceStatus: payment.invoice.status,
      clientId: payment.invoice.clientId,
      clientName: getClientDisplayName(payment.invoice.client),
      status: payment.status,
      amountCents: payment.amountCents,
      feeCents: payment.feeCents,
      refundedCents: payment.refundedCents,
      paidAt: payment.paidAt,
    })),
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 pb-36 sm:px-6 sm:py-7 lg:px-8 lg:pb-12">
      <header className="mb-6 sm:flex sm:items-end sm:justify-between sm:gap-6">
        <div><h1 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-wide text-[var(--forge-text-primary)]">Statistiques</h1><p className="mt-1 text-sm text-[var(--forge-text-muted)]">Suivez l’évolution de votre activité.</p></div>
        <div className="mt-4 sm:mt-0 sm:min-w-[32rem]"><StatisticsFilters period={range.period} from={range.from} to={range.to} /></div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="CA encaissé" value={formatMoney(stats.collectedCents)} hint="Paiements reçus sur la période" />
        <Kpi label="CA facturé" value={formatMoney(stats.billedCents)} hint="Factures émises sur la période" />
        <Kpi label="Devis envoyés" value={String(stats.sentQuotes)} hint="Selon leur date d’envoi" />
        <Kpi label="Acceptation" value={formatRate(stats.acceptanceRate)} hint="Acceptés parmi les devis décidés" />
      </section>

      <section className="forge-surface mt-4 rounded-3xl border border-[var(--forge-border)] p-4 sm:p-6"><h2 className="text-lg font-bold text-[var(--forge-text-primary)]">Évolution du chiffre d’affaires</h2><p className="text-xs text-[var(--forge-text-muted)]">Encaissements nets de remboursements, à leur date de paiement.</p><RevenueChart points={stats.points} /></section>
      <section className="forge-surface mt-4 rounded-3xl border border-[var(--forge-border)] p-4 sm:p-6"><h2 className="text-lg font-bold text-[var(--forge-text-primary)]">Facturé vs encaissé</h2><p className="text-xs text-[var(--forge-text-muted)]">Facturé à la création de la facture émise ; encaissé à la date du paiement.</p><RevenueChart points={stats.points} mode="comparison" /></section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="forge-surface rounded-3xl border border-[var(--forge-border)] p-5 sm:p-6"><h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Devis</h2><Distribution values={[{ label: "Acceptés", value: stats.quoteCounts.accepted, color: "bg-emerald-500" }, { label: "Refusés", value: stats.quoteCounts.refused, color: "bg-rose-500" }, { label: "En attente", value: stats.quoteCounts.pending, color: "bg-blue-500" }]} /><dl className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--forge-border)] pt-4"><div><dt className="text-xs text-[var(--forge-text-muted)]">Devis moyen</dt><dd className="forge-num mt-1 font-bold">{formatMoney(stats.averageQuoteCents)}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">Devis → facture</dt><dd className="forge-num mt-1 font-bold">{formatRate(stats.quoteToInvoiceRate)}</dd></div></dl></section>
        <section className="forge-surface rounded-3xl border border-[var(--forge-border)] p-5 sm:p-6"><h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Factures</h2><Distribution values={[{ label: "Payées", value: stats.invoiceCounts.paid, color: "bg-emerald-500" }, { label: "En attente", value: stats.invoiceCounts.pending, color: "bg-blue-500" }, { label: "En retard", value: stats.invoiceCounts.overdue, color: "bg-rose-500" }]} /><dl className="mt-6 grid grid-cols-3 gap-2 border-t border-[var(--forge-border)] pt-4"><div><dt className="text-xs text-[var(--forge-text-muted)]">Moyenne</dt><dd className="forge-num mt-1 font-bold">{formatMoney(stats.averageInvoiceCents)}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">Payé</dt><dd className="forge-num mt-1 font-bold">{formatMoney(stats.collectedCents)}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">À encaisser</dt><dd className="forge-num mt-1 font-bold">{formatMoney(stats.remainingCents)}</dd></div></dl></section>
      </div>

      <section className="forge-surface mt-4 rounded-3xl border border-[var(--forge-border)] p-5 sm:p-6"><h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Top clients</h2>{stats.topClients.length ? <ol className="mt-4 divide-y divide-[var(--forge-border)]">{stats.topClients.map((client, index) => <li key={client.id}><Link href={`/clients/${client.id}`} className="flex min-h-16 items-center gap-3 py-3"><span className="forge-num w-7 text-lg font-bold text-blue-500">{index + 1}</span><span className="min-w-0 flex-1 truncate font-semibold">{client.name}</span><span className="text-right"><strong className="forge-num block">{formatMoney(client.collectedCents)}</strong><small className="text-[var(--forge-text-muted)]">{client.paidInvoiceCount} facture{client.paidInvoiceCount > 1 ? "s" : ""} payée{client.paidInvoiceCount > 1 ? "s" : ""}</small></span></Link></li>)}</ol> : <p className="mt-5 rounded-2xl border border-dashed border-[var(--forge-border)] p-8 text-center text-sm text-[var(--forge-text-muted)]">Aucun encaissement client sur cette période.</p>}</section>
    </main>
  );
}
