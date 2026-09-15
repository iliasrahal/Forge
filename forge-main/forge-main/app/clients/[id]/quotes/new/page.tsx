import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import QuoteLinesForm from "@/components/QuoteLinesForm";
import QuoteClientSelector from "@/components/quotes/QuoteClientSelector";
import QuotePhotoStarter from "@/components/materials/QuotePhotoStarter";
import DocumentCreateForm, { type DocumentCreateFormState } from "@/components/DocumentCreateForm";
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
import { secureMaterialLineSources } from "@/src/lib/material-catalog.server";
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

  const [client, clients, services] = await Promise.all([
    withoutClient
      ? Promise.resolve(null)
      : prisma.client.findFirst({
          where: {
            id,
            organizationId: workspaceContext.workspace.id,
          },
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        }),
    prisma.client.findMany({
      where: { organizationId: workspaceContext.workspace.id, archived: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, firstName: true, lastName: true, companyName: true, phone: true, email: true, street: true, postalCode: true, city: true },
    }),
    prisma.serviceCatalogItem.findMany({
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
    }),
  ]);

  if (!withoutClient && !client) {
    notFound();
  }

  async function createQuote(
    _state: DocumentCreateFormState,
    formData: FormData,
  ): Promise<DocumentCreateFormState> {
    "use server";

    const currentUser = await requireCurrentUser();
    const writeContext =
      await requireWorkspaceContext(
        "write",
      );

    const clientMode = formData.get("clientMode")?.toString();
    const selectedClientId = formData.get("clientId")?.toString().trim() || null;
    const ownedClient = clientMode === "existing" && selectedClientId
      ? await prisma.client.findFirst({
        where: {
          id: selectedClientId,
          organizationId:
            writeContext.workspace.id,
        },
        select: {
          id: true,
        },
      })
      : null;

    if (clientMode === "existing" && !ownedClient) {
      return { error: "Sélectionne un client accessible dans ce workspace." };
    }

    const newClientType = formData.get("newClientType")?.toString();
    const newClientFirstName = formData.get("newClientFirstName")?.toString().trim() || "";
    const newClientCompanyName = formData.get("newClientCompanyName")?.toString().trim() || "";
    if (clientMode === "new" && newClientType !== "PARTICULIER" && newClientType !== "PROFESSIONNEL") return { error: "Le type du nouveau client est invalide." };
    if (clientMode === "new" && newClientType === "PARTICULIER" && !newClientFirstName) return { error: "Le prénom du nouveau client est obligatoire." };
    if (clientMode === "new" && newClientType === "PROFESSIONNEL" && !newClientCompanyName) return { error: "Le nom de l’entreprise est obligatoire." };

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
      return { error: "Tous les champs obligatoires doivent être remplis." };
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



    const parsedLines = buildDocumentLinesFromForm(
      quoteLinesRaw,
      orgDefaultRateBp,
    );
    const cleanLines = await secureMaterialLineSources(parsedLines, writeContext.workspace.id);

    if (
      cleanLines.length === 0
    ) {
      return { error: "Ajoutez au moins une ligne avec une désignation et un PU HT supérieur à 0." };
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

    let quote;
    try {
      quote = await prisma.$transaction(async (tx) => {
        const createdClient = clientMode === "new" ? await tx.client.create({ data: {
          type: newClientType as "PARTICULIER" | "PROFESSIONNEL",
          firstName: newClientType === "PARTICULIER" ? newClientFirstName : null,
          lastName: newClientType === "PARTICULIER" ? formData.get("newClientLastName")?.toString().trim() || null : null,
          companyName: newClientType === "PROFESSIONNEL" ? newClientCompanyName : null,
          email: formData.get("newClientEmail")?.toString().trim() || null,
          phone: formData.get("newClientPhone")?.toString().trim() || null,
          street: formData.get("newClientStreet")?.toString().trim() || null,
          postalCode: formData.get("newClientPostalCode")?.toString().trim() || null,
          city: formData.get("newClientCity")?.toString().trim() || null,
          userId: currentUser.id,
          organizationId: writeContext.workspace.id,
        } }) : null;
        return tx.quote.create({ data: {
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

          clientId: createdClient?.id ?? ownedClient?.id,

          organizationId:
            writeContext.workspace.id,

          lines: {
            create: cleanLines.map(documentLineCreateData),
          },
        } });
      });
    } catch (error) {
      console.error("CREATE QUOTE ERROR", error);
      return { error: "Impossible d’enregistrer le devis pour le moment. Réessayez." };
    }
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

        <h1 className="mt-4 text-xl font-bold text-blue-700 dark:text-blue-400">Nouveau devis</h1>
      </div>

      <div className="mt-6">
        <QuotePhotoStarter quoteCreationPath={`/clients/${id}/quotes/new`} />
      </div>

      <DocumentCreateForm
        action={createQuote}
        submitLabel="Enregistrer le devis"
        pendingLabel="Enregistrement…"
        cancelHref="/quotes"
      >
        <QuoteClientSelector clients={clients} initialClientId={client?.id ?? null} />
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

      </DocumentCreateForm>
    </main>
  );
}
