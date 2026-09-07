import Link from "next/link";

import { requireCurrentUser } from "@/src/lib/auth";

export default async function AccountPage() {
  const profile = await requireCurrentUser();
  const details = [
    { label: "Nom", value: `${profile.firstName} ${profile.lastName ?? ""}`.trim() },
    { label: "Email", value: profile.email },
    { label: "Téléphone", value: profile.phone },
    { label: "Entreprise", value: profile.companyName || "Non renseignée" },
  ];

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
          Compte
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Gère tes informations personnelles.
        </p>

        <div className="mt-8 space-y-4">
          {details.map((detail) => (
            <div key={detail.label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">{detail.label}</p>
              <p className="mt-1 break-words font-semibold">{detail.value}</p>
            </div>
          ))}
        </div>

        <Link href="/settings/account/edit" className="mt-8 block w-full rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-blue-700">
          Modifier mes informations
        </Link>
      </section>
    </main>
  );
}
