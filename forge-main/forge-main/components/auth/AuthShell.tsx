import Link from "next/link";

import ForgeLogo from "@/components/ForgeLogo";

type AuthShellProps = {
  children: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: string;
  wide?: boolean;
  bare?: boolean;
};

export default function AuthShell({
  children,
  title,
  description,
  eyebrow = "Votre activité, simplement.",
  wide = false,
  bare = true,
}: AuthShellProps) {
  return (
    <main className="relative isolate flex min-h-dvh overflow-hidden bg-[#f6f7f9] px-5 py-8 text-slate-950 dark:bg-[#0a0f1c] dark:text-white sm:px-8 sm:py-12">

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(46rem_24rem_at_82%_-6%,rgba(59,130,246,0.08),transparent_70%),radial-gradient(40rem_22rem_at_-6%_2%,rgba(99,102,241,0.06),transparent_70%)] dark:bg-[radial-gradient(46rem_24rem_at_82%_-6%,rgba(37,99,235,0.16),transparent_70%),radial-gradient(40rem_22rem_at_-6%_2%,rgba(79,70,229,0.12),transparent_70%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:opacity-25"
      />


      <div
        className={`auth-page-enter mx-auto my-auto w-full ${
          wide ? "max-w-xl" : "max-w-md"
        }`}
      >

        <header className="mb-8 text-center sm:mb-10">

          <Link
            href="/"
            aria-label="Retour à l’accueil Forge"
            className="group inline-flex items-center rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900"
          >

            <span className="transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
              <ForgeLogo size={82} />
            </span>

          </Link>


          {!bare && (
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
              {eyebrow}
            </p>
          )}


          <h1
            className={`mx-auto text-balance text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl ${
              bare ? "mt-8" : "mt-3"
            }`}
          >
            {title}
          </h1>


          {description && (
            <p className="mx-auto mt-3 max-w-md text-pretty leading-7 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          )}

        </header>


        {/* Formulaire sans carte blanche : intégré dans le fond */}
        <section className={`mx-auto ${wide ? "max-w-xl" : "max-w-sm"}`}>
          {children}
        </section>


        {!bare && (
          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
            Forge · Pensé pour les artisans
          </p>
        )}

      </div>

    </main>
  );
}
