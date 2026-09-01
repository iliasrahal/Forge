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
    <main className="forge-auth-shell relative isolate flex min-h-dvh overflow-hidden bg-transparent px-5 py-8 sm:px-8 sm:py-12">

      <div
        aria-hidden="true"
        className="forge-auth-light pointer-events-none absolute inset-0 -z-20"
      />

      <div
        aria-hidden="true"
        className="forge-auth-grain pointer-events-none absolute inset-0 -z-10"
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
            className="group inline-flex items-center rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900"
          >

            <span className="relative transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 scale-125 rounded-full bg-blue-500/20 blur-2xl"
              />
              <span className="forge-auth-logo inline-flex rounded-[1.6rem] border p-3">
                <ForgeLogo size={72} />
              </span>
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
