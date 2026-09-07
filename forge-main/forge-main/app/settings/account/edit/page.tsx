import Link from "next/link";

import EditAccountForm from "@/components/account/EditAccountForm";
import { requireCurrentUser } from "@/src/lib/auth";

export default async function EditAccountPage() {
  const user = await requireCurrentUser();

  return (
    <main className="min-dvh px-6 py-8 text-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/settings/account"
          className="forge-back-link text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Modifier mon compte
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Mets à jour tes informations Forge.
        </p>

        <EditAccountForm
          initialProfile={{
            firstName: user.firstName,
            lastName: user.lastName ?? "",
            email: user.email,
            phone: user.phone,
            companyName: user.companyName ?? "",
          }}
        />
      </section>
    </main>
  );
}
