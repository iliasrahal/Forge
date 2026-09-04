import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import QuoteLinesForm from "@/components/QuoteLinesForm";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { parseSerializedQuoteLines } from "@/src/lib/quote-catalog-matching";
import {
  buildDocumentLinesFromForm,
  computeDocumentMargin,
  normalizeDiscountBp,
} from "@/src/lib/document-lines";
import {
  computeDocumentTotals,
  normalizeVatRateBp,
} from "@/src/lib/vat";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

type NewInvoicePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    title?: string;
    description?: string;
    invoiceLines?: string;
  }>;
};

export default async function NewInvoicePage({
  params,
  searchParams,
}: NewInvoicePageProps) {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("write");

  const { id } = await params;
  const { title, description, invoiceLines } = await searchParams;

  const initialLines = parseSerializedQuoteLines(invoiceLines);

  const client = await prisma.client.findFirst({
    where: { id, organizationId: workspaceContext.workspace.id },
  });

  const services = await prisma.serviceCatalogItem.findMany({
    where: { organizationId: workspaceContext.workspace.id },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, priceCents: true, pricingType: true },
  });

  if (!client) {
    notFound();
  }

  const clientName =
    client.type === "PROFESSIONNEL"
      ? client.companyName
      : `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim();

  async function createInvoice(formData: FormData) {
    "use server";

    await requireCurrentUser();
    const writeContext = await requireWorkspaceContext("write");

    const ownedClient = await prisma.client.findFirst({
      where: { id, organizationId: writeContext.workspace.id },
      select: { id: true },
    });

    if (!ownedClient) {
      notFound();
    }

    const title = formData.get("title")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const dueDateRaw = formData.get("dueDate")?.toString().trim();
    const invoiceLinesRaw = formData.get("invoiceLines")?.toString();

    if (!title || !invoiceLinesRaw) {
      throw new Error("Le titre et au moins une ligne sont obligatoires.");
    }

    const orgDefaultRateBp = normalizeVatRateBp(
      writeContext.workspace.defaultVatRateBp,
      2000,
    );
    const vatApplicable =
      formData.get("vatApplicable")?.toString() === "true";
    const documentDiscountBp = normalizeDiscountBp(
      formData.get("documentDiscount"),
    );

    const cleanLines = buildDocumentLinesFromForm(
      invoiceLinesRaw,
      orgDefaultRateBp,
    );

    if (cleanLines.length === 0) {
      throw new Error("Ajoute au moins une ligne à la facture.");
    }

    const totals = computeDocumentTotals(
      cleanLines,
      vatApplicable,
      documentDiscountBp,
    );
    const { totalCostCents } = computeDocumentMargin(
      cleanLines,
      documentDiscountBp,
    );

    let dueDate: Date | null = null;
    if (dueDateRaw) {
      const parsed = new Date(dueDateRaw);
      if (!Number.isNaN(parsed.getTime())) {
        dueDate = parsed;
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        reference: `FAC-${Date.now()}`,
        title,
        description: description || null,
        amountCents: totals.totalTtcCents,
        vatApplicable,
        totalHtCents: totals.totalHtCents,
        totalVatCents: totals.totalVatCents,
        discountBp: documentDiscountBp,
        totalCostCents,
        status: "BROUILLON",
        type: "STANDARD",
        dueDate,
        clientId: ownedClient.id,
        organizationId: writeContext.workspace.id,
        lines: {
          create: cleanLines.map((line) => ({
            category: line.category,
            label: line.label,
            quantityMilli: line.quantityMilli,
            unit: line.unit,
            unitPriceCents: line.unitPriceCents,
            costCents: line.costCents,
            discountBp: line.discountBp,
            amountCents: line.amountCents,
            vatRateBp: line.vatRateBp,
          })),
        },
      },
    });

    redirect(`/invoices/${invoice.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <div>
        <Link
          href={`/clients/${id}`}
          aria-label="Retour au dossier client"
          className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>Retour</span>
        </Link>

        <p className="mt-4 text-xl font-bold text-blue-700 dark:text-blue-400">
          {clientName || "Client sans nom"}
        </p>
      </div>

      <form
        action={createInvoice}
        className="forge-surface mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Titre de la facture
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={title ?? ""}
            placeholder="Exemple : Remplacement chauffe-eau"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Description (facultative)
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={description ?? ""}
            placeholder="Détaille les travaux facturés si besoin..."
            className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="dueDate"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Échéance (facultative)
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <QuoteLinesForm
          initialTitle={title}
          initialLines={initialLines}
          linesFieldName="invoiceLines"
          defaultVatApplicable={workspaceContext.workspace.vatScheme === "SUBJECT"}
          defaultVatRateBp={workspaceContext.workspace.defaultVatRateBp}
          services={services}
          canWrite={workspaceContext.permissions.canWrite}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Enregistrer la facture
          </button>
          <Link
            href={`/clients/${id}`}
            className="rounded-2xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Annuler
          </Link>
        </div>
      </form>
    </main>
  );
}
