import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import QuoteLinesForm from "@/components/QuoteLinesForm";
import DocumentCreateForm, { type DocumentCreateFormState } from "@/components/DocumentCreateForm";
import { prisma } from "@/src/lib/prisma";
import { QuoteStatus } from "@/src/generated/prisma/client";
import { requireCurrentUser } from "@/src/lib/auth";
import {
  allocateAvailableDocumentNumber,
  isDraftReference,
} from "@/src/lib/document-numbering";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { canTransitionQuoteStatus, isQuoteContractLocked } from "@/src/lib/quote-status";
import {
  buildDocumentLinesFromForm,
  computeDocumentMargin,
  documentLineCreateData,
  normalizeDiscountBp,
} from "@/src/lib/document-lines";
import type { EditableQuoteLine } from "@/src/lib/quote-lines";
import { computeDocumentTotals, normalizeVatRateBp } from "@/src/lib/vat";
import {
  getQuoteClientName,
  getQuotePath,
  UNASSIGNED_QUOTE_CLIENT_ID,
} from "@/src/lib/quote-routes";


type EditQuotePageProps = {
  params: Promise<{
    id: string;
    quoteId: string;
  }>;
};

function editableLine(line: {
  category: string;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  costCents: number | null;
  discountBp: number;
  vatRateBp: number;
  details: Array<{ label: string; description: string | null; amountCents: number | null }>;
}): EditableQuoteLine {
  return {
    category: line.category,
    quantity: String(line.quantityMilli / 1000),
    unit: line.unit,
    unitPrice: (line.unitPriceCents / 100).toFixed(2),
    discount: line.discountBp ? String(line.discountBp / 100) : "",
    cost: line.costCents == null ? "" : (line.costCents / 100).toFixed(2),
    vatRateBp: line.vatRateBp,
    details: line.details.map((detail) => ({
      label: detail.label,
      description: detail.description ?? "",
      amount: detail.amountCents == null ? "" : (detail.amountCents / 100).toFixed(2),
    })),
  };
}



export default async function EditQuotePage({
  params,
}: EditQuotePageProps) {
  const { id, quoteId } = await params;
  const withoutClient = id === UNASSIGNED_QUOTE_CLIENT_ID;
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("write");


  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      ...(withoutClient ? { clientId: null } : { clientId: id }),
      organizationId: workspaceContext.workspace.id,
    },
    include: {
      client: true,
      signature: { select: { id: true } },
      lines: {
        orderBy: { createdAt: "asc" },
        include: { details: { orderBy: { position: "asc" } } },
      },
    },
  });


  if (!quote) {
    notFound();
  }

  if (isQuoteContractLocked(quote.status, Boolean(quote.signature))) {
    redirect(getQuotePath(quote));
  }

  const clients = await prisma.client.findMany({
    where: {
      organizationId: workspaceContext.workspace.id,
      archived: false,
    },
    orderBy: [{ companyName: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      type: true,
      firstName: true,
      lastName: true,
      companyName: true,
    },
  });

  const services = await prisma.serviceCatalogItem.findMany({
    where: { organizationId: workspaceContext.workspace.id },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, priceCents: true, pricingType: true },
  });

  const clientName = getQuoteClientName(quote.client);



  async function updateQuote(_state: DocumentCreateFormState, formData: FormData): Promise<DocumentCreateFormState> {
    "use server";

    const writeContext = await requireWorkspaceContext("write");


    const title = formData
      .get("title")
      ?.toString()
      .trim();


    const rawLines = formData.get("quoteLines")?.toString();


    const status = formData
      .get("status")
      ?.toString();
    const selectedClientId = formData.get("clientId")?.toString().trim() || null;



    if (!title || !rawLines || !status) {
      return { error: "Tous les champs obligatoires doivent être remplis." };
    }

    if (selectedClientId) {
      const selectedClient = await prisma.client.findFirst({
        where: {
          id: selectedClientId,
          organizationId: writeContext.workspace.id,
          archived: false,
        },
        select: { id: true },
      });
      if (!selectedClient) {
        return { error: "Le client sélectionné est introuvable." };
      }
    }



    const allowedStatuses = [
      "BROUILLON",
      "ENVOYE",
      "ACCEPTE",
      "REFUSE",
    ];



    if (!allowedStatuses.includes(status)) {
      return { error: "Le statut du devis est invalide." };
    }

    const quoteStatus = status as QuoteStatus;

    const currentQuote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        organizationId: writeContext.workspace.id,
      },
      select: {
        status: true,
        reference: true,
        signature: { select: { id: true } },
      },
    });

    if (!currentQuote) notFound();
    if (isQuoteContractLocked(currentQuote.status, Boolean(currentQuote.signature))) {
      return { error: "Un devis accepté ne peut plus être modifié." };
    }
    if (!canTransitionQuoteStatus(currentQuote.status, quoteStatus)) {
      return { error: "Cette transition de statut n’est pas autorisée." };
    }



    const defaultVatRateBp = normalizeVatRateBp(writeContext.workspace.defaultVatRateBp, 2000);
    const lines = buildDocumentLinesFromForm(rawLines, defaultVatRateBp);
    if (lines.length === 0) return { error: "Ajoutez au moins une ligne avec une désignation et un PU HT supérieur à 0." };
    const vatApplicable = formData.get("vatApplicable")?.toString() === "true";
    const discountBp = normalizeDiscountBp(formData.get("documentDiscount"));
    const totals = computeDocumentTotals(lines, vatApplicable, discountBp);
    const margin = computeDocumentMargin(lines, discountBp);

    // Numéro définitif à la première sortie de « Brouillon ».
    const leavingDraft =
      currentQuote.status === "BROUILLON" &&
      quoteStatus !== "BROUILLON" &&
      isDraftReference(currentQuote.reference);
    let finalReference: string | undefined;
    try {
      if (leavingDraft) {
        const allocated = await prisma.$transaction((tx) =>
        allocateAvailableDocumentNumber(tx, {
          organizationId: writeContext.workspace.id,
          kind: "QUOTE",
          prefix: writeContext.workspace.quotePrefix,
          referenceExists: async (reference) => Boolean(await tx.quote.findUnique({ where: { reference }, select: { id: true } })),
        }),
        );
        finalReference = allocated.reference;
      }



      const updated = await prisma.$transaction(async (transaction) => {
      const result = await transaction.quote.updateMany({
        where: {
          id: quoteId,
          organizationId: writeContext.workspace.id,
          signature: { is: null },
          status: currentQuote.status,
        },
        data: {
          title,
          amountCents: totals.totalTtcCents,
          totalHtCents: totals.totalHtCents,
          totalVatCents: totals.totalVatCents,
          vatApplicable,
          discountBp,
          totalCostCents: margin.totalCostCents,
          status: quoteStatus,
          clientId: selectedClientId,
          ...(finalReference ? { reference: finalReference } : {}),
        },
      });
      if (result.count !== 1) return result;
      await transaction.quoteLine.deleteMany({ where: { quoteId } });
      await transaction.quote.update({
        where: { id: quoteId },
        data: { lines: { create: lines.map(documentLineCreateData) } },
      });
      return result;
      });

      if (updated.count !== 1) notFound();
    } catch (error) {
      console.error("UPDATE QUOTE ERROR", error);
      return { error: "Impossible d’enregistrer le devis pour le moment. Réessayez." };
    }



    redirect(getQuotePath({ id: quoteId, clientId: selectedClientId }));
  }



  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">


      <div>


        <Link
          href="/quotes"
          aria-label="Retour aux devis"
          className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>
            Retour
          </span>
        </Link>



        <p className="mt-4 text-xl font-bold text-blue-700 dark:text-blue-400">
          {clientName}
        </p>


      </div>



      <DocumentCreateForm
        action={updateQuote}
        submitLabel="Enregistrer les modifications"
        pendingLabel="Enregistrement…"
        cancelHref={getQuotePath(quote)}
      >

        <div>
          <label
            htmlFor="clientId"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Client (facultatif)
          </label>
          <select
            id="clientId"
            name="clientId"
            defaultValue={quote.clientId ?? ""}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
          >
            <option value="">Aucun client pour le moment</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {getQuoteClientName(client)}
              </option>
            ))}
          </select>
        </div>


        <div>


          <label
            htmlFor="title"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Titre du devis
          </label>



          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={quote.title}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
          />


        </div>



        <QuoteLinesForm
          initialTitle={quote.title}
          initialLines={quote.lines.map(editableLine)}
          initialVatApplicable={quote.vatApplicable}
          initialDocumentDiscount={quote.discountBp ? String(quote.discountBp / 100) : ""}
          initialTrackMargins={quote.lines.some((line) => line.costCents != null)}
          defaultVatApplicable={workspaceContext.workspace.vatScheme === "SUBJECT"}
          defaultVatRateBp={workspaceContext.workspace.defaultVatRateBp}
          services={services}
          canWrite
        />



        <div>


          <label
            htmlFor="status"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Statut
          </label>



          <select
            id="status"
            name="status"
            required
            defaultValue={quote.status}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
          >
            <option value="BROUILLON">
              Brouillon
            </option>

            <option value="ENVOYE">
              Envoyé
            </option>

            <option value="ACCEPTE">
              Accepté
            </option>

            <option value="REFUSE">
              Refusé
            </option>

          </select>


        </div>



      </DocumentCreateForm>


    </main>
  );
}
