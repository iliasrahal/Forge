import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import CreateCreditNoteForm from "@/components/CreateCreditNoteForm";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import {
  canCreateCreditNote,
  maxCreditableCents,
  sumIssuedCreditsCents,
} from "@/src/lib/credit-notes";
import { displayDocumentReference } from "@/src/lib/document-numbering";

type PageProps = { params: Promise<{ id: string }> };

function formatEur(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default async function NewCreditNotePage({ params }: PageProps) {
  await requireCurrentUser();
  const context = await requireWorkspaceContext("write");
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: context.workspace.id },
    include: {
      lines: { orderBy: { createdAt: "asc" } },
      creditNotes: { select: { status: true, amountCents: true } },
    },
  });

  if (!invoice) notFound();
  if (!canCreateCreditNote(invoice.status) || invoice.lines.length === 0) {
    redirect(`/invoices/${invoice.id}`);
  }

  const alreadyCredited = sumIssuedCreditsCents(invoice.creditNotes);
  const ceiling = maxCreditableCents(invoice.amountCents, alreadyCredited);

  const lineOptions = invoice.lines.map((line) => ({
    id: line.id,
    label: line.label || line.category,
    amountCents: line.amountCents,
  }));

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <Link
        href={`/invoices/${invoice.id}`}
        className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
      >
        Retour à la facture
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-blue-700 dark:text-blue-400">
        Créer un avoir
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Facture {displayDocumentReference(invoice.reference)} ·{" "}
        {formatEur(invoice.amountCents)}
        {alreadyCredited > 0
          ? ` · déjà avoiré ${formatEur(alreadyCredited)}`
          : ""}
      </p>

      {ceiling <= 0 ? (
        <p className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Cette facture est déjà entièrement avoirée.
        </p>
      ) : (
        <CreateCreditNoteForm
          invoiceId={invoice.id}
          lines={lineOptions}
          maxCreditableCents={ceiling}
        />
      )}
    </main>
  );
}
