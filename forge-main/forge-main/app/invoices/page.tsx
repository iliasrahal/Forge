import Link from "next/link";
import { Receipt } from "lucide-react";

import FixedForgeBar from "@/components/FixedForgeBar";
import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { displayDocumentReference } from "@/src/lib/document-numbering";
import { statusChipClasses } from "@/src/lib/document-status-style";


function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}


function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}


function formatStatus(status: string) {
  const statuses: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    PAYEE: "Payée",
    EN_RETARD: "En retard",
    ANNULEE: "Annulée",
  };

  return statuses[status] ?? status;
}



export default async function InvoicesPage() {


  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");



  const invoices =
    await prisma.invoice.findMany({

      where: {
        organizationId: workspaceContext.workspace.id,
      },

      orderBy: {
        createdAt: "desc",
      },

    });



  return (

    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 pb-56 sm:px-6 sm:py-6">

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/invoices/new"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 sm:px-5"
        >
          Nouvelle facture
        </Link>
        <Link
          href="/invoices/stats"
          className="flex min-h-12 items-center justify-center rounded-2xl border border-blue-600 px-4 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 sm:px-5"
        >
          Historique Factures
        </Link>
      </div>


      <div className="mt-6">

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--forge-border)] px-6 py-14 text-center">
            <Receipt
              className="h-8 w-8 text-[var(--forge-text-muted)]"
              strokeWidth={1.5}
            />
            <p className="mt-4 text-base font-semibold text-[var(--forge-text-primary)]">
              Aucune facture pour l’instant
            </p>
            <p className="mt-1 max-w-xs text-sm text-[var(--forge-text-muted)]">
              Crée une facture directement ou depuis un devis accepté.
            </p>
            <Link
              href="/invoices/new"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
            >
              Nouvelle facture
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  aria-label={`Ouvrir la facture ${invoice.reference}`}
                  className="forge-surface flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950/50"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-[var(--forge-text-primary)]">
                      <span className="truncate">{invoice.title}</span>
                      {invoice.type === "DEPOSIT" ? (
                        <span className="shrink-0 rounded-full border border-[var(--forge-border)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--forge-text-muted)]">
                          Acompte
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--forge-text-muted)]">
                      {displayDocumentReference(invoice.reference)} ·{" "}
                      {formatDate(invoice.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="text-sm font-bold text-[var(--forge-text-primary)]">
                      {formatAmount(invoice.amountCents)}
                    </span>
                    <span className={statusChipClasses(invoice.status)}>
                      {formatStatus(invoice.status)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

      </div>


      <FixedForgeBar context="invoices" />



    </main>

  );
}
