import Link from "next/link";
import { redirect } from "next/navigation";

import QuoteLinesForm from "@/components/QuoteLinesForm";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import {
  buildDocumentLinesFromForm,
  normalizeDiscountBp,
} from "@/src/lib/document-lines";
import { normalizeVatRateBp } from "@/src/lib/vat";
import { persistableToTemplateLineData } from "@/src/lib/quote-templates";

export default async function NewQuoteTemplatePage() {
  await requireCurrentUser();
  const context = await requireWorkspaceContext("write");

  const services = await prisma.serviceCatalogItem.findMany({
    where: { organizationId: context.workspace.id },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, priceCents: true, pricingType: true },
  });

  async function createTemplate(formData: FormData) {
    "use server";
    const writeContext = await requireWorkspaceContext("write");

    const name = formData.get("name")?.toString().trim();
    const title = formData.get("title")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const linesRaw = formData.get("quoteLines")?.toString();
    if (!name || !title || !linesRaw) {
      throw new Error("Le nom, le titre et au moins une ligne sont obligatoires.");
    }

    const orgDefaultRateBp = normalizeVatRateBp(
      writeContext.workspace.defaultVatRateBp,
      2000,
    );
    const cleanLines = buildDocumentLinesFromForm(linesRaw, orgDefaultRateBp);
    if (cleanLines.length === 0) {
      throw new Error("Ajoute au moins une ligne au modèle.");
    }
    const vatApplicable =
      formData.get("vatApplicable")?.toString() === "true";
    const discountBp = normalizeDiscountBp(formData.get("documentDiscount"));
    const retentionPercent = Number(
      String(formData.get("retentionPercent") ?? "0").replace(",", "."),
    );
    const retentionBp =
      Number.isFinite(retentionPercent) && retentionPercent >= 0
        ? Math.min(10000, Math.round(retentionPercent * 100))
        : 0;

    await prisma.quoteTemplate.create({
      data: {
        organizationId: writeContext.workspace.id,
        name: name.slice(0, 120),
        title,
        description: description || null,
        vatApplicable,
        discountBp,
        retentionBp,
        lines: { create: persistableToTemplateLineData(cleanLines) },
      },
    });

    redirect("/settings/quote-templates");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <Link
        href="/settings/quote-templates"
        className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
      >
        Retour
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-blue-700 dark:text-blue-400">
        Nouveau modèle de devis
      </h1>

      <form
        action={createTemplate}
        className="forge-surface mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Nom du modèle
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Exemple : Rénovation salle de bain"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Titre de devis par défaut
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Exemple : Rénovation complète salle de bain"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Description par défaut{" "}
            <span className="font-normal text-slate-400">(facultatif)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <QuoteLinesForm
          defaultVatApplicable={context.workspace.vatScheme === "SUBJECT"}
          defaultVatRateBp={context.workspace.defaultVatRateBp}
          services={services}
          canWrite={context.permissions.canWrite}
        />

        <div>
          <label
            htmlFor="retentionPercent"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Retenue de garantie par défaut
          </label>
          <div className="flex items-center gap-1">
            <input
              id="retentionPercent"
              name="retentionPercent"
              type="number"
              min="0"
              max="100"
              step="0.5"
              defaultValue="0"
              className="w-24 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-slate-500">%</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Enregistrer le modèle
        </button>
      </form>
    </main>
  );
}
