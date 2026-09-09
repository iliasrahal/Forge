import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import LogoUploader from "@/components/LogoUploader";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

type BrandingPageProps = {
  searchParams: Promise<{ saved?: string }>;
};

const IDENTITY_SELECT = {
  logoDataUrl: true,
  legalName: true,
  siret: true,
  vatNumber: true,
  apeCode: true,
  addressStreet: true,
  addressPostalCode: true,
  addressCity: true,
  contactPhone: true,
  contactEmail: true,
} as const;

export default async function BrandingSettingsPage({
  searchParams,
}: BrandingPageProps) {
  await requireCurrentUser();
  const context = await requireWorkspaceContext("write");
  const { saved } = await searchParams;

  const organization = await prisma.organization.findUnique({
    where: { id: context.workspace.id },
    select: IDENTITY_SELECT,
  });

  async function saveIdentity(formData: FormData) {
    "use server";

    const writeContext = await requireWorkspaceContext("write");

    const text = (key: string, max: number) => {
      const value = formData.get(key)?.toString().trim() ?? "";
      return value ? value.slice(0, max) : null;
    };
    const digits = (key: string, max: number) => {
      const value = (formData.get(key)?.toString() ?? "").replace(/\s+/g, "");
      return value ? value.slice(0, max) : null;
    };

    await prisma.organization.update({
      where: { id: writeContext.workspace.id },
      data: {
        legalName: text("legalName", 160),
        siret: digits("siret", 20),
        vatNumber: text("vatNumber", 20)?.toUpperCase() ?? null,
        apeCode: text("apeCode", 10)?.toUpperCase() ?? null,
        addressStreet: text("addressStreet", 160),
        addressPostalCode: text("addressPostalCode", 12),
        addressCity: text("addressCity", 80),
        contactPhone: text("contactPhone", 30),
        contactEmail: text("contactEmail", 160),
      },
    });

    revalidatePath("/settings/branding");
    redirect("/settings/branding?saved=1");
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

  return (
    <main className="min-h-dvh px-6 py-8 text-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/settings"
          className="forge-back-link text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400"
        >
          Retour
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Logo et identité
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Ces informations apparaissent en tête des devis, factures et avoirs que
          tu envoies.
        </p>

        <LogoUploader initialLogoDataUrl={organization?.logoDataUrl ?? null} />

        <form
          action={saveIdentity}
          className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Coordonnées de l’entreprise
          </p>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Entreprise
            </legend>

            <label className="block text-sm font-medium">
              Raison sociale
              <input
                name="legalName"
                defaultValue={organization?.legalName ?? ""}
                placeholder="SARL Martin Bâtiment"
                className={inputClass}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                SIRET
                <input
                  name="siret"
                  defaultValue={organization?.siret ?? ""}
                  inputMode="numeric"
                  placeholder="123 456 789 00012"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium">
                Code APE / NAF
                <input
                  name="apeCode"
                  defaultValue={organization?.apeCode ?? ""}
                  placeholder="4321A"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block text-sm font-medium">
              N° TVA intracommunautaire
              <input
                name="vatNumber"
                defaultValue={organization?.vatNumber ?? ""}
                placeholder="FR12 345678900"
                className={inputClass}
              />
            </label>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Adresse
            </legend>

            <label className="block text-sm font-medium">
              Adresse
              <input
                name="addressStreet"
                defaultValue={organization?.addressStreet ?? ""}
                placeholder="12 rue des Artisans"
                className={inputClass}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <label className="block text-sm font-medium">
                Code postal
                <input
                  name="addressPostalCode"
                  defaultValue={organization?.addressPostalCode ?? ""}
                  placeholder="75011"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium">
                Ville
                <input
                  name="addressCity"
                  defaultValue={organization?.addressCity ?? ""}
                  placeholder="Paris"
                  className={inputClass}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Contact
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Téléphone
                <input
                  name="contactPhone"
                  defaultValue={organization?.contactPhone ?? ""}
                  type="tel"
                  placeholder="01 02 03 04 05"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium">
                Email
                <input
                  name="contactEmail"
                  defaultValue={organization?.contactEmail ?? ""}
                  type="email"
                  placeholder="devis@monentreprise.fr"
                  className={inputClass}
                />
              </label>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Laisse vide pour reprendre le téléphone et l’email de ton compte.
            </p>
          </fieldset>

          {saved === "1" ? (
            <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
              Identité enregistrée.
            </p>
          ) : null}

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
