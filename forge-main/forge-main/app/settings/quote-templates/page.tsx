import Link from "next/link";
import { LayoutTemplate } from "lucide-react";

import UseQuoteTemplateButton from "@/components/UseQuoteTemplateButton";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function QuoteTemplatesPage() {
  await requireCurrentUser();
  const context = await requireWorkspaceContext("read");

  const templates = await prisma.quoteTemplate.findMany({
    where: { organizationId: context.workspace.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { lines: true } } },
  });

  return (
    <main className="min-h-dvh px-6 py-8 text-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/settings"
          className="forge-back-link text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400"
        >
          Retour
        </Link>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
            Modèles de devis
          </h1>
          {context.permissions.canWrite ? (
            <Link
              href="/settings/quote-templates/new"
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Nouveau modèle
            </Link>
          ) : null}
        </div>

        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Prépare un devis type et réutilise-le en un clic pour un nouveau
          client.
        </p>

        {templates.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[var(--forge-border)] px-6 py-14 text-center">
            <LayoutTemplate
              className="h-8 w-8 text-[var(--forge-text-muted)]"
              strokeWidth={1.5}
            />
            <p className="mt-4 text-base font-semibold text-[var(--forge-text-primary)]">
              Aucun modèle pour l’instant
            </p>
            <p className="mt-1 max-w-xs text-sm text-[var(--forge-text-muted)]">
              Prépare un devis type (prestations, TVA, retenue) et réutilise-le en
              un clic.
            </p>
            {context.permissions.canWrite ? (
              <Link
                href="/settings/quote-templates/new"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
              >
                Nouveau modèle
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {templates.map((template) => (
              <li
                key={template.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {template.name}
                </p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {template.title} · {template._count.lines} ligne
                  {template._count.lines > 1 ? "s" : ""}
                  {template.retentionBp > 0
                    ? ` · retenue ${template.retentionBp / 100} %`
                    : ""}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {context.permissions.canWrite ? (
                    <UseQuoteTemplateButton templateId={template.id} />
                  ) : null}
                  {context.permissions.canWrite ? (
                    <Link
                      href={`/settings/quote-templates/${template.id}/edit`}
                      className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                    >
                      Modifier
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
