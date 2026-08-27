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
  bare = false,
}: AuthShellProps) {
  return (
    <main className="relative isolate flex min-h-dvh overflow-hidden bg-slate-50 px-5 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_10%,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_86%_88%,rgba(14,165,233,0.08),transparent_28%)] dark:bg-[radial-gradient(circle_at_18%_10%,rgba(59,130,246,0.13),transparent_30%),radial-gradient(circle_at_86%_88%,rgba(14,165,233,0.08),transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)] dark:opacity-20"
      />

      <div className={`auth-page-enter mx-auto my-auto w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
        <header className="mb-8 text-center sm:mb-10">
          <Link
            href="/"
            aria-label="Retour à l’accueil Forge"
            className="group inline-flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900"
          >
            <span className="transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
              <ForgeLogo size={54} />
            </span>
            <span className="text-2xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white">
              Forge
            </span>
          </Link>

          {!bare && (
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
              {eyebrow}
            </p>
          )}
          <h1 className={`mx-auto text-balance text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl ${bare ? "mt-8" : "mt-3"}`}>
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-3 max-w-md text-pretty leading-7 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          )}
        </header>

        <section className={bare ? "mx-auto max-w-sm" : "rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)] sm:p-8"}>
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
