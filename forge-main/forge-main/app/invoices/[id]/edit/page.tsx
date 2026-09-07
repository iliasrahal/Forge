import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import QuoteLinesForm from "@/components/QuoteLinesForm";
import { prisma } from "@/src/lib/prisma";
import {
  buildDocumentLinesFromForm,
  computeDocumentMargin,
  normalizeDiscountBp,
} from "@/src/lib/document-lines";
import type { EditableQuoteLine } from "@/src/lib/quote-lines";
import { computeDocumentTotals, normalizeVatRateBp } from "@/src/lib/vat";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

type EditInvoicePageProps = { params: Promise<{ id: string }> };

function editableLine(line: {
  category: string;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  costCents: number | null;
  discountBp: number;
  vatRateBp: number;
}): EditableQuoteLine {
  return {
    category: line.category,
    quantity: String(line.quantityMilli / 1000),
    unit: line.unit,
    unitPrice: (line.unitPriceCents / 100).toFixed(2),
    discount: line.discountBp ? String(line.discountBp / 100) : "",
    cost: line.costCents == null ? "" : (line.costCents / 100).toFixed(2),
    vatRateBp: line.vatRateBp,
  };
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const context = await requireWorkspaceContext("write");
  const { id } = await params;
  const [invoice, services] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, organizationId: context.workspace.id },
      include: { lines: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.serviceCatalogItem.findMany({
      where: { organizationId: context.workspace.id },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, priceCents: true, pricingType: true },
    }),
  ]);

  if (!invoice) notFound();
  if (invoice.status !== "BROUILLON" || invoice.type === "DEPOSIT") {
    redirect(`/invoices/${invoice.id}`);
  }

  async function updateInvoice(formData: FormData) {
    "use server";
    const writeContext = await requireWorkspaceContext("write");
    const current = await prisma.invoice.findFirst({
      where: { id, organizationId: writeContext.workspace.id, status: "BROUILLON", type: "STANDARD" },
      select: { id: true },
    });
    if (!current) notFound();

    const title = formData.get("title")?.toString().trim();
    const rawLines = formData.get("invoiceLines")?.toString();
    if (!title || !rawLines) throw new Error("Le titre et au moins une ligne sont obligatoires.");

    const defaultRate = normalizeVatRateBp(writeContext.workspace.defaultVatRateBp, 2000);
    const lines = buildDocumentLinesFromForm(rawLines, defaultRate);
    if (lines.length === 0) throw new Error("Ajoute au moins une ligne à la facture.");

    const vatApplicable = formData.get("vatApplicable")?.toString() === "true";
    const discountBp = normalizeDiscountBp(formData.get("documentDiscount"));
    const totals = computeDocumentTotals(lines, vatApplicable, discountBp);
    const margin = computeDocumentMargin(lines, discountBp);

    await prisma.invoice.update({
      where: { id: current.id },
      data: {
        title,
        amountCents: totals.totalTtcCents,
        vatApplicable,
        totalHtCents: totals.totalHtCents,
        totalVatCents: totals.totalVatCents,
        discountBp,
        totalCostCents: margin.totalCostCents,
        lines: {
          deleteMany: {},
          create: lines,
        },
      },
    });
    redirect(`/invoices/${current.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <Link href={`/invoices/${invoice.id}`} className="forge-back-link text-base font-semibold text-blue-600 dark:text-blue-400">
        Retour
      </Link>
      <form action={updateInvoice} className="forge-surface mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400">Titre de la facture</label>
          <input id="title" name="title" required defaultValue={invoice.title} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
        <QuoteLinesForm
          initialTitle={invoice.title}
          initialLines={invoice.lines.map(editableLine)}
          initialVatApplicable={invoice.vatApplicable}
          initialDocumentDiscount={invoice.discountBp ? String(invoice.discountBp / 100) : ""}
          initialTrackMargins={invoice.lines.some((line) => line.costCents != null)}
          defaultVatApplicable={context.workspace.vatScheme === "SUBJECT"}
          defaultVatRateBp={context.workspace.defaultVatRateBp}
          linesFieldName="invoiceLines"
          services={services}
          canWrite
        />
        <button type="submit" className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700">Enregistrer les modifications</button>
      </form>
    </main>
  );
}
