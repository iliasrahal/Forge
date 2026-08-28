import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

type EmailSignaturePageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function EmailSignaturePage({
  searchParams,
}: EmailSignaturePageProps) {
  const currentUser = await requireCurrentUser();
  const { saved } = await searchParams;

  async function saveEmailSignature(
    formData: FormData,
  ) {
    "use server";

    const user = await requireCurrentUser();
    const value = formData.get("emailSignature");

    if (typeof value !== "string") {
      throw new Error(
        "La signature saisie est invalide.",
      );
    }

    const emailSignature = value.trim();

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailSignature:
          emailSignature || null,
      },
    });

    revalidatePath(
      "/settings/email-signature",
    );
    redirect(
      "/settings/email-signature?saved=1",
    );
  }

  return (
    <main className="min-h-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/settings"
          className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Signature email
        </h1>

        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Personnalise la signature ajoutée aux devis et factures envoyés à tes clients.
        </p>

        <form
          action={saveEmailSignature}
          className="mt-8 space-y-4"
        >
          <div>
            <label
              htmlFor="emailSignature"
              className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
            >
              Ta signature
            </label>

            <textarea
              id="emailSignature"
              name="emailSignature"
              rows={5}
              defaultValue={
                currentUser.emailSignature ?? ""
              }
              placeholder={currentUser.firstName}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
            />

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sans signature personnalisée, ton prénom sera utilisé automatiquement.
            </p>
          </div>

          {saved === "1" && (
            <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
              Signature enregistrée.
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
