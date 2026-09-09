import Link from "next/link";
import { FileText } from "lucide-react";


import FixedForgeBar from "@/components/FixedForgeBar";
import UseQuoteTemplateButton from "@/components/UseQuoteTemplateButton";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { getQuoteReminderState } from "@/src/lib/quote-reminders";
import { displayDocumentReference } from "@/src/lib/document-numbering";
import { getQuoteClientName, getQuotePath } from "@/src/lib/quote-routes";
import { statusChipClasses } from "@/src/lib/document-status-style";



function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}



function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}



function formatStatus(status: string) {
  const statuses: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYE: "Envoyé",
    ACCEPTE: "Accepté",
    REFUSE: "Refusé",
  };


  return statuses[status] ?? status;
}



export default async function QuotesPage() {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");



  const quotes =
    await prisma.quote.findMany({
      where: {
        organizationId: workspaceContext.workspace.id,
      },


      include: {
        client: true,
        reminders: {
          select: { sentAt: true },
          orderBy: { sentAt: "desc" },
        },
      },


      orderBy: {
        createdAt: "desc",
      },
    });

  const templates = workspaceContext.permissions.canWrite
    ? await prisma.quoteTemplate.findMany({
        where: { organizationId: workspaceContext.workspace.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true, _count: { select: { lines: true } } },
      })
    : [];



  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 pb-56 sm:px-6 sm:py-6">


      <div className={`mb-6 grid gap-3 ${workspaceContext.permissions.canWrite ? "min-[380px]:grid-cols-2" : ""}`}>



        {workspaceContext.permissions.canWrite ? (
          <Link
            href="/quotes/new"
            className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 sm:px-5"
          >
            + Nouveau devis
          </Link>
        ) : null}




        <Link
          href="/quotes/stats"
          className="flex min-h-12 items-center justify-center rounded-2xl border border-blue-600 px-4 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950 sm:px-5"
        >
          Historique Devis
        </Link>



      </div>


      {templates.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--forge-text-primary)]">
              Partir d’un modèle
            </p>
            <Link
              href="/settings/quote-templates"
              className="text-xs font-semibold text-[var(--forge-accent-blue-lit)] hover:underline"
            >
              Gérer
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-[var(--forge-border)]">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[var(--forge-text-primary)]">
                    {template.name}
                  </span>
                  <span className="text-xs text-[var(--forge-text-muted)]">
                    {template._count.lines} ligne
                    {template._count.lines > 1 ? "s" : ""}
                  </span>
                </span>
                <UseQuoteTemplateButton templateId={template.id} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}




      <div className="flex-1">

        {quotes.length > 0 ? (
          <ul className="space-y-2">
            {quotes.map((quote) => {
              const reminderState = getQuoteReminderState({
                status: quote.status,
                sentAt: quote.sentAt,
                reminders: quote.reminders,
              });
              const clientName = getQuoteClientName(quote.client);

              return (
                <li key={quote.id}>
                  <Link
                    href={getQuotePath(quote)}
                    className="forge-surface flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--forge-text-primary)]">
                        {quote.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[var(--forge-text-muted)]">
                        <span className="tabular-nums">
                          {displayDocumentReference(quote.reference)} ·{" "}
                          {formatDate(quote.createdAt)}
                        </span>
                        {clientName ? ` · ${clientName}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      {reminderState.eligible ? (
                        <span className="hidden text-xs font-semibold text-amber-600 sm:inline dark:text-amber-400">
                          À relancer
                        </span>
                      ) : null}
                      <span className="text-sm font-bold forge-num text-[var(--forge-text-primary)]">
                        {formatCurrency(quote.amountCents)}
                      </span>
                      <span className={statusChipClasses(quote.status)}>
                        {formatStatus(quote.status)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--forge-border)] px-6 py-14 text-center">
            <FileText
              className="h-8 w-8 text-[var(--forge-text-muted)]"
              strokeWidth={1.5}
            />
            <p className="mt-4 text-base font-semibold text-[var(--forge-text-primary)]">
              Aucun devis pour l’instant
            </p>
            <p className="mt-1 max-w-xs text-sm text-[var(--forge-text-muted)]">
              Crée ton premier devis, ou pars d’un modèle enregistré.
            </p>
            {workspaceContext.permissions.canWrite ? (
              <Link
                href="/quotes/new"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
              >
                + Nouveau devis
              </Link>
            ) : null}
          </div>
        )}

      </div>




      <FixedForgeBar context="quotes" />



    </main>
  );
}
