import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { normalizeVatRateBp, VAT_RATES_BP, formatVatRateBp } from "@/src/lib/vat";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

type FacturationPageProps = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function FacturationSettingsPage({
  searchParams,
}: FacturationPageProps) {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("write");
  const { saved } = await searchParams;

  const workspace = workspaceContext.workspace;

  async function saveVatSettings(formData: FormData) {
    "use server";

    const writeContext = await requireWorkspaceContext("write");

    const scheme =
      formData.get("vatScheme")?.toString() === "SUBJECT"
        ? "SUBJECT"
        : "FRANCHISE_BASE";
    const defaultVatRateBp = normalizeVatRateBp(
      formData.get("defaultVatRateBp"),
      2000,
    );

    await prisma.organization.update({
      where: { id: writeContext.workspace.id },
      data: { vatScheme: scheme, defaultVatRateBp },
    });

    revalidatePath("/settings/facturation");
    redirect("/settings/facturation?saved=1");
  }

  return (
    <main className="min-h-dvh px-6 py-8 text-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/settings"
          className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          TVA et facturation
        </h1>

        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Régime de TVA appliqué par défaut aux nouveaux devis et factures de
          l’espace{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {workspace.name}
          </span>
          . Chaque document peut ensuite être ajusté.
        </p>

        <form action={saveVatSettings} className="mt-8 space-y-6">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Régime de TVA
            </legend>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="radio"
                name="vatScheme"
                value="FRANCHISE_BASE"
                defaultChecked={workspace.vatScheme !== "SUBJECT"}
                className="mt-1 h-4 w-4 text-blue-600"
              />
              <span>
                <span className="block font-semibold">
                  Franchise en base (art. 293 B du CGI)
                </span>
                <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                  Aucune TVA facturée. La mention légale est ajoutée aux
                  documents.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="radio"
                name="vatScheme"
                value="SUBJECT"
                defaultChecked={workspace.vatScheme === "SUBJECT"}
                className="mt-1 h-4 w-4 text-blue-600"
              />
              <span>
                <span className="block font-semibold">Assujetti à la TVA</span>
                <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                  La TVA est calculée par ligne, au taux choisi.
                </span>
              </span>
            </label>
          </fieldset>

          <div>
            <label
              htmlFor="defaultVatRateBp"
              className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
            >
              Taux de TVA par défaut
            </label>
            <select
              id="defaultVatRateBp"
              name="defaultVatRateBp"
              defaultValue={String(
                normalizeVatRateBp(workspace.defaultVatRateBp, 2000),
              )}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {VAT_RATES_BP.map((rateBp) => (
                <option key={rateBp} value={rateBp}>
                  {formatVatRateBp(rateBp)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Appliqué aux nouvelles lignes ; modifiable ligne par ligne.
            </p>
          </div>

          {saved === "1" && (
            <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
              Réglage enregistré.
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Enregistrer
          </button>
        </form>
      </section>
    </main>
  );
}
