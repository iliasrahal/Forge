import Link from "next/link";

import FixedForgeBar from "@/components/FixedForgeBar";
import QuoteStatsSelector from "@/components/QuoteStatsSelector";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";


const months = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];


export default async function InvoiceStatsPage() {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: workspaceContext.workspace.id,
    },
    select: {
      amountCents: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    new Set(invoices.map((invoice) => invoice.createdAt.getFullYear())),
  );
  const years = Array.from(new Set([currentYear, ...availableYears])).sort(
    (a, b) => b - a,
  );
  const yearInvoices = invoices.filter(
    (invoice) => invoice.createdAt.getFullYear() === currentYear,
  );
  const monthlyTotals = months.map((month, index) => ({
    month,
    total: yearInvoices
      .filter((invoice) => invoice.createdAt.getMonth() === index)
      .reduce((sum, invoice) => sum + invoice.amountCents, 0),
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
          monthlyTotals={monthlyTotals}
          statsEndpoint="/api/invoices/stats"
        />
      </div>

      <FixedForgeBar context="invoices" />
    </main>
  );
}
