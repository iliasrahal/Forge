import Link from "next/link";
import { Receipt } from "lucide-react";

import FixedForgeBar from "@/components/FixedForgeBar";
import DocumentSearchList, {
  type SearchableDocument,
} from "@/components/DocumentSearchList";
import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { displayDocumentReference } from "@/src/lib/document-numbering";


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

      include: {
        client: {
          select: {
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },

    });

  const searchableInvoices: SearchableDocument[] = invoices.map((invoice) => {
    const clientName =
      invoice.client.type === "PROFESSIONNEL"
        ? invoice.client.companyName?.trim() || "Client professionnel"
        : `${invoice.client.firstName ?? ""} ${invoice.client.lastName ?? ""}`.trim() ||
          "Client sans nom";

    return {
      id: invoice.id,
      href: `/invoices/${invoice.id}`,
      title: invoice.title,
      reference: displayDocumentReference(invoice.reference),
      date: formatDate(invoice.createdAt),
      amount: formatAmount(invoice.amountCents),
      status: invoice.status,
      statusLabel: formatStatus(invoice.status),
      searchValues: [
        clientName,
        invoice.client.firstName ?? "",
        invoice.client.lastName ?? "",
        `${invoice.client.firstName ?? ""} ${invoice.client.lastName ?? ""}`,
        invoice.client.companyName ?? "",
        invoice.title,
        invoice.reference,
        displayDocumentReference(invoice.reference),
      ],
      badge: invoice.type === "DEPOSIT" ? "Acompte" : undefined,
    };
  });



  return (

    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 pb-56 sm:px-6 sm:py-6">

      <div className={`mb-6 grid gap-3 ${workspaceContext.permissions.canWrite ? "sm:grid-cols-2" : ""}`}>
        {workspaceContext.permissions.canWrite ? (
          <Link
            href="/invoices/new"
            className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 sm:px-5"
          >
            Nouvelle facture
          </Link>
        ) : null}
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
            {workspaceContext.permissions.canWrite ? (
              <Link
                href="/invoices/new"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
              >
                Nouvelle facture
              </Link>
            ) : null}
          </div>
        ) : (
          <DocumentSearchList
            documents={searchableInvoices}
            documentLabel="facture"
            placeholder="Rechercher une facture…"
          />
        )}

      </div>


      <FixedForgeBar context="invoices" />



    </main>

  );
}
