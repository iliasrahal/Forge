import Link from "next/link";

import FixedForgeBar from "@/components/FixedForgeBar";
import QuoteStatsSelector from "@/components/QuoteStatsSelector";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { getParisYearMonth } from "@/src/lib/document-history";


export default async function InvoiceStatsPage() {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: workspaceContext.workspace.id,
    },
    select: {
      id: true,
      title: true,
      reference: true,
      status: true,
      type: true,
      amountCents: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const currentYear = getParisYearMonth(new Date()).year;
  const availableYears = Array.from(
    new Set(invoices.map((invoice) => getParisYearMonth(invoice.createdAt).year)),
  );
  const years = Array.from(new Set([currentYear, ...availableYears])).sort(
    (a, b) => b - a,
  );
  const statusLabels: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    PAYEE: "Payée",
    EN_RETARD: "En retard",
    ANNULEE: "Annulée",
  };
  const initialDocuments = invoices
    .filter(
      (invoice) => getParisYearMonth(invoice.createdAt).year === currentYear,
    )
    .map((invoice) => ({
      id: invoice.id,
      title: invoice.title,
      reference: `Facture ${invoice.reference}`,
      amountCents: invoice.amountCents,
      createdAt: invoice.createdAt.toISOString(),
      statusLabel: statusLabels[invoice.status] ?? invoice.status,
      href: `/invoices/${invoice.id}`,
      badge: invoice.type === "DEPOSIT" ? "Facture d’acompte" : undefined,
    }));

  return (
    <main className="min-h-screen pb-32">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <Link
            href="/invoices"
            className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Retour
          </Link>
        </div>

        <h1 className="mb-5 text-center text-2xl font-bold text-blue-700 dark:text-blue-400 sm:text-3xl">
          Historique Factures
        </h1>

        <QuoteStatsSelector
          year={currentYear}
          years={years}
          initialDocuments={initialDocuments}
          statsEndpoint="/api/invoices/stats"
          documentLabel="facture"
        />
      </div>

      <FixedForgeBar context="invoices" />
    </main>
  );
}
