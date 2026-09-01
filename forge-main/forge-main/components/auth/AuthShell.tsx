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
    <main className="relative isolate flex min-h-dvh overflow-hidden bg-[#f4f6fb] px-5 py-8 text-slate-950 dark:bg-[#0a0f1c] dark:text-white sm:px-8 sm:py-12">

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(56rem_30rem_at_50%_-12%,rgba(76,110,245,0.16),transparent_66%),radial-gradient(42rem_28rem_at_112%_-4%,rgba(129,140,248,0.12),transparent_58%),radial-gradient(38rem_28rem_at_-10%_4%,rgba(99,102,241,0.08),transparent_60%)] dark:bg-[radial-gradient(56rem_30rem_at_50%_-12%,rgba(37,99,235,0.26),transparent_66%),radial-gradient(42rem_28rem_at_112%_-4%,rgba(79,70,229,0.2),transparent_58%),radial-gradient(38rem_28rem_at_-10%_4%,rgba(79,70,229,0.16),transparent_60%)]"
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
            className="group inline-flex items-center rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900"
          >

            <span className="relative transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 scale-125 rounded-full bg-blue-500/20 blur-2xl"
              />
              <span className="inline-flex rounded-[1.6rem] border border-slate-200/80 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(37,99,235,0.45)] dark:border-slate-700/80 dark:bg-slate-900">
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
