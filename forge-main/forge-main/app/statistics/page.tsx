import Link from "next/link";

import RevenueChart from "@/components/statistics/RevenueChart";
import StatisticsFilters from "@/components/statistics/StatisticsFilters";
import { getClientDisplayName } from "@/src/lib/client-name";
import { prisma } from "@/src/lib/prisma";
import { formatDuration } from "@/src/lib/intervention-profitability";
import { buildOperationalStatistics, buildStatistics, percentageChange, previousStatisticsRange, resolveStatisticsRange } from "@/src/lib/statistics";
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

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[var(--forge-text-muted)]">Comparaison indisponible</span>;
  return <span className={value > 0 ? "text-emerald-600 dark:text-emerald-400" : value < 0 ? "text-rose-600 dark:text-rose-400" : "text-[var(--forge-text-muted)]"}>{value > 0 ? "+" : ""}{value} % vs période précédente</span>;
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
  const previousRange = previousStatisticsRange(range);
  const dateWhere = { gte: range.start, lt: range.endExclusive };
  const combinedDateWhere = { gte: previousRange.start, lt: range.endExclusive };

  const [invoices, quotes, payments, interventions, purchases] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId: workspace.workspace.id, OR: [{ sentAt: combinedDateWhere }, { sentAt: null, createdAt: combinedDateWhere }] },
      select: {
        id: true, quoteId: true, clientId: true, amountCents: true, status: true, createdAt: true, sentAt: true,
        payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } },
        creditNotes: { select: { status: true, amountCents: true } },
      },
    }),
    prisma.quote.findMany({
      where: { organizationId: workspace.workspace.id, OR: [{ sentAt: combinedDateWhere }, { acceptedAt: combinedDateWhere }] },
      select: {
        id: true, amountCents: true, status: true, sentAt: true, acceptedAt: true,
        invoices: { select: { status: true } },
      },
    }),
    prisma.payment.findMany({
      where: { organizationId: workspace.workspace.id, status: "SUCCEEDED", paidAt: combinedDateWhere },
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
    prisma.intervention.findMany({
      where: { organizationId: workspace.workspace.id, scheduledAt: { lt: range.endExclusive }, OR: [{ endDate: { gte: range.start } }, { endDate: null, scheduledAt: dateWhere }] },
      select: {
        id: true, title: true,
        quote: { select: { status: true, amountCents: true, totalCostCents: true, lines: { select: { lineType: true, quantityMilli: true, unit: true, costCents: true } } } },
        invoices: { select: { status: true, amountCents: true, payments: { select: { status: true, amountCents: true, feeCents: true, refundedCents: true, paidAt: true } }, creditNotes: { select: { status: true, amountCents: true } } } },
        expenses: { select: { amountCents: true, category: true, purchaseId: true } },
        workTimes: { select: { userId: true, durationMinutes: true, hourlyCostCents: true, user: { select: { firstName: true, lastName: true } } } },
        materialUsages: { select: { quantityMilli: true, actualUnitCostCents: true, purchaseLineId: true } },
        purchaseAllocations: { select: { amountCents: true, lineType: true, materialUsageId: true } },
      },
    }),
    prisma.purchase.findMany({
      where: { organizationId: workspace.workspace.id, status: "ACTIVE", purchasedAt: dateWhere },
      select: { totalAmountCents: true, supplierId: true, supplierName: true, supplier: { select: { name: true, companyName: true } } },
    }),
  ]);

  const mappedPayments = payments.map((payment) => ({
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
    }));
  const stats = buildStatistics({ range, invoices, quotes, payments: mappedPayments });
  const previousStats = buildStatistics({ range: previousRange, invoices, quotes, payments: mappedPayments });
  const operations = buildOperationalStatistics({
    interventions: interventions.map((intervention) => ({ id: intervention.id, title: intervention.title, profitability: {
      quote: intervention.quote,
      invoices: intervention.invoices,
      expenses: intervention.expenses,
      workTimes: intervention.workTimes.map((entry) => ({ userId: entry.userId, memberName: `${entry.user.firstName} ${entry.user.lastName ?? ""}`.trim(), durationMinutes: entry.durationMinutes, hourlyCostCents: entry.hourlyCostCents })),
      materialUsages: intervention.materialUsages,
      purchaseAllocations: intervention.purchaseAllocations,
    } })),
    purchases: purchases.map((purchase) => ({ totalAmountCents: purchase.totalAmountCents, supplierId: purchase.supplierId, supplierName: purchase.supplier?.companyName || purchase.supplier?.name || purchase.supplierName || "Sans fournisseur" })),
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 pb-36 sm:px-6 sm:py-7 lg:px-8 lg:pb-12">
      <header className="mb-6 sm:flex sm:items-end sm:justify-between sm:gap-6">
        <div><h1 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-wide text-[var(--forge-text-primary)]">Statistiques</h1><p className="mt-1 text-sm text-[var(--forge-text-muted)]">Suivez l’évolution de votre activité.</p></div>
        <div className="mt-4 sm:mt-0 sm:min-w-[32rem]"><StatisticsFilters period={range.period} from={range.from} to={range.to} /></div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label="Vendu" value={formatMoney(stats.soldCents)} hint="Devis acceptés sur la période" />
        <Kpi label="Facturé net" value={formatMoney(stats.billedCents)} hint="Factures émises, avoirs déduits" />
        <Kpi label="Encaissé" value={formatMoney(stats.collectedCents)} hint="Paiements reçus, remboursements déduits" />
        <Kpi label="Reste à encaisser" value={formatMoney(stats.remainingCents)} hint="Facturé net encore dû" />
        <Kpi label="Coûts chantiers" value={operations.totalCostCents === null ? "—" : formatMoney(operations.totalCostCents)} hint={operations.incompleteInterventions ? `${operations.incompleteInterventions} chantier(s) avec données incomplètes` : "Coûts réels complets"} />
        <Kpi label="Marge actuelle" value={operations.marginCents === null ? "—" : formatMoney(operations.marginCents)} hint={operations.marginPercent === null ? "Non calculable avec les données disponibles" : `${operations.marginPercent} % sur les chantiers calculables`} />
      </section>

      <section className="forge-surface mt-4 grid gap-3 rounded-3xl border border-[var(--forge-border)] p-4 text-sm sm:grid-cols-2 sm:p-5">
        <p><strong className="block text-[var(--forge-text-primary)]">Encaissé</strong><Change value={percentageChange(stats.collectedCents, previousStats.collectedCents)} /></p>
        <p><strong className="block text-[var(--forge-text-primary)]">Facturé net</strong><Change value={percentageChange(stats.billedCents, previousStats.billedCents)} /></p>
      </section>

      <section className="forge-surface mt-4 rounded-3xl border border-[var(--forge-border)] p-4 sm:p-6"><h2 className="text-lg font-bold text-[var(--forge-text-primary)]">Évolution du chiffre d’affaires</h2><p className="text-xs text-[var(--forge-text-muted)]">Encaissements nets de remboursements, à leur date de paiement.</p><RevenueChart points={stats.points} /></section>
      <section className="forge-surface mt-4 rounded-3xl border border-[var(--forge-border)] p-4 sm:p-6"><h2 className="text-lg font-bold text-[var(--forge-text-primary)]">Facturé vs encaissé</h2><p className="text-xs text-[var(--forge-text-muted)]">Facturé à la création de la facture émise ; encaissé à la date du paiement.</p><RevenueChart points={stats.points} mode="comparison" /></section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="forge-surface rounded-3xl border border-[var(--forge-border)] p-5 sm:p-6"><h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Devis</h2><Distribution values={[{ label: "Acceptés", value: stats.quoteCounts.accepted, color: "bg-emerald-500" }, { label: "Refusés", value: stats.quoteCounts.refused, color: "bg-rose-500" }, { label: "En attente", value: stats.quoteCounts.pending, color: "bg-blue-500" }]} /><dl className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--forge-border)] pt-4"><div><dt className="text-xs text-[var(--forge-text-muted)]">Devis moyen</dt><dd className="forge-num mt-1 font-bold">{formatMoney(stats.averageQuoteCents)}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">Devis → facture</dt><dd className="forge-num mt-1 font-bold">{formatRate(stats.quoteToInvoiceRate)}</dd></div></dl></section>
        <section className="forge-surface rounded-3xl border border-[var(--forge-border)] p-5 sm:p-6"><h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Factures</h2><Distribution values={[{ label: "Payées", value: stats.invoiceCounts.paid, color: "bg-emerald-500" }, { label: "En attente", value: stats.invoiceCounts.pending, color: "bg-blue-500" }, { label: "En retard", value: stats.invoiceCounts.overdue, color: "bg-rose-500" }]} /><dl className="mt-6 grid grid-cols-3 gap-2 border-t border-[var(--forge-border)] pt-4"><div><dt className="text-xs text-[var(--forge-text-muted)]">Moyenne</dt><dd className="forge-num mt-1 font-bold">{formatMoney(stats.averageInvoiceCents)}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">Payé</dt><dd className="forge-num mt-1 font-bold">{formatMoney(stats.collectedCents)}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">À encaisser</dt><dd className="forge-num mt-1 font-bold">{formatMoney(stats.remainingCents)}</dd></div></dl></section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="forge-surface rounded-3xl border border-[var(--forge-border)] p-5 sm:p-6">
          <h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Rentabilité par chantier</h2>
          <p className="mt-1 text-xs text-[var(--forge-text-muted)]">Classement limité aux chantiers dont le revenu et les coûts sont calculables.</p>
          {operations.interventions.length ? <div className="mt-4 space-y-2">{operations.interventions.slice(0, 6).map((intervention) => <Link key={intervention.id} href={`/interventions/${intervention.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl bg-white/45 p-3 dark:bg-slate-900/35"><span className="min-w-0"><strong className="block truncate">{intervention.title}</strong><small className="text-[var(--forge-text-muted)]">Vendu {formatMoney(intervention.soldCents)} · Coûts {formatMoney(intervention.costCents)}</small></span><span className={`forge-num self-center font-bold ${intervention.marginCents < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatMoney(intervention.marginCents)}</span></Link>)}</div> : <p className="mt-4 text-sm text-[var(--forge-text-muted)]">Aucun chantier entièrement calculable sur cette période.</p>}
        </section>
        <section className="forge-surface rounded-3xl border border-[var(--forge-border)] p-5 sm:p-6">
          <h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Temps et coûts</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3"><div><dt className="text-xs text-[var(--forge-text-muted)]">Temps travaillé</dt><dd className="forge-num mt-1 text-xl font-bold">{formatDuration(operations.workedMinutes)}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">Achats</dt><dd className="forge-num mt-1 text-xl font-bold">{formatMoney(operations.purchasesCents)}</dd></div></dl>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--forge-border)] pt-3 text-sm"><div><dt className="text-xs text-[var(--forge-text-muted)]">Coûts prévus</dt><dd className="forge-num mt-1 font-bold">{operations.plannedCostCents === null ? "—" : formatMoney(operations.plannedCostCents)}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">Coûts réels</dt><dd className="forge-num mt-1 font-bold">{operations.totalCostCents === null ? "—" : formatMoney(operations.totalCostCents)}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">Temps prévu</dt><dd className="forge-num mt-1 font-bold">{operations.plannedMinutes ? formatDuration(operations.plannedMinutes) : "—"}</dd></div><div><dt className="text-xs text-[var(--forge-text-muted)]">Marge prévue</dt><dd className="forge-num mt-1 font-bold">{operations.plannedMarginCents === null ? "—" : formatMoney(operations.plannedMarginCents)}</dd></div></dl>
          {operations.timeByMember.length > 1 ? <div className="mt-4 border-t border-[var(--forge-border)] pt-3">{operations.timeByMember.slice(0, 5).map((member) => <p key={member.userId} className="flex justify-between py-1 text-sm"><span>{member.memberName}</span><strong className="forge-num">{formatDuration(member.workedMinutes)}</strong></p>)}</div> : null}
          <div className="mt-4 border-t border-[var(--forge-border)] pt-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--forge-text-muted)]">Répartition des coûts chantier</p>{[
            ["Matériel", operations.costs.materials], ["Main-d’œuvre", operations.costs.labor], ["Déplacement", operations.costs.travel], ["Location", operations.costs.rental], ["Sous-traitance", operations.costs.subcontracting], ["Autre", operations.costs.other],
          ].filter((entry) => Number(entry[1]) > 0).map(([label, amount]) => <p key={String(label)} className="flex justify-between py-1 text-sm"><span>{label}</span><strong className="forge-num">{formatMoney(Number(amount))}</strong></p>)}</div>
        </section>
      </div>

      {operations.suppliers.length ? <section className="forge-surface mt-4 rounded-3xl border border-[var(--forge-border)] p-5 sm:p-6"><h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Principaux fournisseurs</h2><p className="mt-1 text-xs text-[var(--forge-text-muted)]">Achats réels enregistrés sur la période.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{operations.suppliers.map((supplier) => <div key={supplier.id} className="flex justify-between rounded-2xl bg-white/45 p-3 text-sm dark:bg-slate-900/35"><span className="truncate font-semibold">{supplier.name}</span><strong className="forge-num ml-3">{formatMoney(supplier.amountCents)}</strong></div>)}</div></section> : null}

      <section className="forge-surface mt-4 rounded-3xl border border-[var(--forge-border)] p-5 sm:p-6"><h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Top clients — encaissé</h2>{stats.topClients.length ? <ol className="mt-4 divide-y divide-[var(--forge-border)]">{stats.topClients.map((client, index) => <li key={client.id}><Link href={`/clients/${client.id}`} className="flex min-h-16 items-center gap-3 py-3"><span className="forge-num w-7 text-lg font-bold text-blue-500">{index + 1}</span><span className="min-w-0 flex-1 truncate font-semibold">{client.name}</span><span className="text-right"><strong className="forge-num block">{formatMoney(client.collectedCents)}</strong><small className="text-[var(--forge-text-muted)]">{client.paidInvoiceCount} facture{client.paidInvoiceCount > 1 ? "s" : ""} payée{client.paidInvoiceCount > 1 ? "s" : ""}</small></span></Link></li>)}</ol> : <p className="mt-5 rounded-2xl border border-dashed border-[var(--forge-border)] p-8 text-center text-sm text-[var(--forge-text-muted)]">Aucun encaissement client sur cette période.</p>}</section>
    </main>
  );
}
