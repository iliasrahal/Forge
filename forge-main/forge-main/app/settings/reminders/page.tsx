import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

type RemindersPageProps = {
  searchParams: Promise<{ saved?: string }>;
};

function clampDays(value: FormDataEntryValue | null, fallback: number, min = 1, max = 90) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export default async function RemindersSettingsPage({
  searchParams,
}: RemindersPageProps) {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("write");
  const { saved } = await searchParams;

  const workspace = workspaceContext.workspace;

  async function saveReminderSettings(formData: FormData) {
    "use server";

    const writeContext = await requireWorkspaceContext("write");

    const quoteReminderDelay1Days = clampDays(formData.get("quoteReminderDelay1Days"), 3);
    const quoteReminderDelay2Days = Math.max(
      quoteReminderDelay1Days + 1,
      clampDays(formData.get("quoteReminderDelay2Days"), 7),
    );
    const invoiceReminderDelay1Days = clampDays(formData.get("invoiceReminderDelay1Days"), 7);
    const invoiceReminderDelay2Days = Math.max(
      invoiceReminderDelay1Days + 1,
      clampDays(formData.get("invoiceReminderDelay2Days"), 15),
    );
    const invoiceReminderDelay3Days = Math.max(
      invoiceReminderDelay2Days + 1,
      clampDays(formData.get("invoiceReminderDelay3Days"), 30),
    );
    const quoteReminderAutoSend = formData.get("quoteReminderAutoSend") === "on";
    const invoiceReminderAutoSend = formData.get("invoiceReminderAutoSend") === "on";

    await prisma.organization.update({
      where: { id: writeContext.workspace.id },
      data: {
        quoteReminderDelay1Days,
        quoteReminderDelay2Days,
        invoiceReminderDelay1Days,
        invoiceReminderDelay2Days,
        invoiceReminderDelay3Days,
        quoteReminderAutoSend,
        invoiceReminderAutoSend,
      },
    });

    revalidatePath("/settings/reminders");
    redirect("/settings/reminders?saved=1");
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
          Relances automatiques
        </h1>

        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Depuis la fiche d’un devis ou d’une facture, un bouton « Relancer »
          envoie une relance manuelle en un clic, à tout moment — même avant
          l’échéance. Passé ces délais, Forge te la signale comme conseillée.
          Et si tu préfères ne rien avoir à faire, active l’envoi automatique
          ci-dessous : Forge enverra alors les relances toute seule, dès le
          délai atteint, sans aucun clic de ta part.
        </p>

        <form action={saveReminderSettings} className="mt-8 space-y-6">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Devis en attente
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                1ère relance (jours)
                <input
                  type="number"
                  name="quoteReminderDelay1Days"
                  min={1}
                  max={90}
                  defaultValue={workspace.quoteReminderDelay1Days}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <label className="block text-sm font-medium">
                2ème relance (jours)
                <input
                  type="number"
                  name="quoteReminderDelay2Days"
                  min={1}
                  max={90}
                  defaultValue={workspace.quoteReminderDelay2Days}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Délai compté depuis l’envoi du devis, puis depuis la relance
              précédente. 2 relances maximum en automatique par devis
              (relances manuelles illimitées).
            </p>
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="checkbox"
                name="quoteReminderAutoSend"
                defaultChecked={workspace.quoteReminderAutoSend}
                className="mt-1 h-4 w-4 rounded text-blue-600"
              />
              <span>
                <span className="block font-semibold">
                  Envoi automatique, sans validation
                </span>
                <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                  Forge envoie elle-même les relances de devis dès le délai
                  atteint, avec un message standard, sans que tu aies à
                  cliquer.
                </span>
              </span>
            </label>
          </fieldset>

          <fieldset className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-700">
            <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Factures impayées
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium">
                1ère relance (jours)
                <input
                  type="number"
                  name="invoiceReminderDelay1Days"
                  min={1}
                  max={90}
                  defaultValue={workspace.invoiceReminderDelay1Days}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <label className="block text-sm font-medium">
                2ème relance (jours)
                <input
                  type="number"
                  name="invoiceReminderDelay2Days"
                  min={1}
                  max={90}
                  defaultValue={workspace.invoiceReminderDelay2Days}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <label className="block text-sm font-medium">
                3ème relance (jours)
                <input
                  type="number"
                  name="invoiceReminderDelay3Days"
                  min={1}
                  max={90}
                  defaultValue={workspace.invoiceReminderDelay3Days}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Délai compté depuis l’échéance de la facture (ou son envoi si
              aucune échéance n’est définie), puis depuis la relance
              précédente. 3 relances maximum en automatique par facture
              (relances manuelles illimitées).
            </p>
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="checkbox"
                name="invoiceReminderAutoSend"
                defaultChecked={workspace.invoiceReminderAutoSend}
                className="mt-1 h-4 w-4 rounded text-blue-600"
              />
              <span>
                <span className="block font-semibold">
                  Envoi automatique, sans validation
                </span>
                <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                  Forge envoie elle-même les relances de factures impayées dès
                  le délai atteint, avec un message standard, sans que tu
                  aies à cliquer.
                </span>
              </span>
            </label>
          </fieldset>

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
