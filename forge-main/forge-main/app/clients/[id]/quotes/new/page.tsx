import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import QuoteLinesForm from "@/components/QuoteLinesForm";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { parseSerializedQuoteLines } from "@/src/lib/quote-catalog-matching";
import {
  buildDocumentLinesFromForm,
  computeDocumentMargin,
  documentLineCreateData,
  normalizeDiscountBp,
} from "@/src/lib/document-lines";
import { draftReference } from "@/src/lib/document-numbering";
import {
  computeDocumentTotals,
  normalizeVatRateBp,
} from "@/src/lib/vat";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import {
  getQuotePath,
  UNASSIGNED_QUOTE_CLIENT_ID,
} from "@/src/lib/quote-routes";

type NewQuotePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    title?: string;
    quoteLines?: string;
  }>;
};

export default async function NewQuotePage({
  params,
  searchParams,
}: NewQuotePageProps) {
  await requireCurrentUser();

  const workspaceContext =
    await requireWorkspaceContext("write");

  const { id } = await params;
  const withoutClient = id === UNASSIGNED_QUOTE_CLIENT_ID;

  const {
    title,
    quoteLines,
  } = await searchParams;

  const initialLines =
    parseSerializedQuoteLines(
      quoteLines,
    );

  const client = withoutClient
    ? null
    : await prisma.client.findFirst({
      where: {
        id,
        organizationId:
          workspaceContext.workspace.id,
      },
    });

  const services =
    await prisma.serviceCatalogItem.findMany({
      where: {
        organizationId:
          workspaceContext.workspace.id,
      },
      orderBy: [
        { name: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        name: true,
        priceCents: true,
        pricingType: true,
      },
    });

  if (!withoutClient && !client) {
    notFound();
  }

  const clientName = !client
    ? "Aucun client associé"
    : client.type === "PROFESSIONNEL"
      ? client.companyName
      : `${client.firstName ?? ""} ${
          client.lastName ?? ""
        }`.trim();

  async function createQuote(
    formData: FormData,
  ) {
    "use server";

    await requireCurrentUser();

    const writeContext =
      await requireWorkspaceContext(
        "write",
      );

    const ownedClient = withoutClient
      ? null
      : await prisma.client.findFirst({
        where: {
          id,
          organizationId:
            writeContext.workspace.id,
        },
        select: {
          id: true,
        },
      });

    if (!withoutClient && !ownedClient) {
      notFound();
    }

    const title =
      formData
        .get("title")
        ?.toString()
        .trim();

    const quoteLinesRaw =
      formData
        .get("quoteLines")
        ?.toString();

    if (
      !title ||
      !quoteLinesRaw
    ) {
      throw new Error(
        "Tous les champs obligatoires doivent être remplis.",
      );
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
      quoteLinesRaw,
      orgDefaultRateBp,
    );

    if (
      cleanLines.length === 0
    ) {
      throw new Error(
        "Ajoute au moins une ligne au devis.",
      );
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



    const reference = draftReference();

    const quote =
      await prisma.quote.create({
        data: {
          reference,
          title,
          description: "",
          amountCents: totals.totalTtcCents,
          vatApplicable,
          totalHtCents: totals.totalHtCents,
          totalVatCents: totals.totalVatCents,
          discountBp: documentDiscountBp,
          totalCostCents,
          status:
            "BROUILLON",

          clientId: ownedClient?.id,

          organizationId:
            writeContext.workspace.id,

          lines: {
            create: cleanLines.map(documentLineCreateData),
          },
        },
      });

    redirect(getQuotePath(quote));
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
          {clientName ||
            "Client sans nom"}
        </p>
      </div>

      <form
        action={createQuote}
        className="forge-surface mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
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
            defaultValue={
              title ?? ""
            }
            placeholder="Exemple : Remplacement chauffe-eau"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <QuoteLinesForm
          initialTitle={title}
          initialLines={initialLines}
          defaultVatApplicable={workspaceContext.workspace.vatScheme === "SUBJECT"}
          defaultVatRateBp={workspaceContext.workspace.defaultVatRateBp}
          services={services}
          canWrite={
            workspaceContext
              .permissions
              .canWrite
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Enregistrer le devis
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
