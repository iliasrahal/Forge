import Link from "next/link";


export default function SettingsPage() {
  return (
    <main className="min-h-dvh bg-white px-6 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-xl">


        <Link
          href="/app"
          className="forge-back-link text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>




        <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
          Options
        </h1>





        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Personnalise ton expérience Forge.
        </p>





        <div className="mt-8 space-y-3">

          <Link
            href="/settings/appearance"
            className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left font-semibold transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500"
          >
            Apparence
          </Link>





          <Link
            href="/settings/account"
            className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left font-semibold transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500"
          >
            Compte
          </Link>





          <Link
            href="/settings/email-signature"
            className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left font-semibold transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500"
          >
            Signature email
          </Link>





          <Link
            href="/settings/security"
            className="block w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left font-semibold transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500"
          >
            Sécurité
          </Link>




        </div>




      </section>
    </main>
  );
}
