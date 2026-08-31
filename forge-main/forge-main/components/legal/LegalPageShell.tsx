import Link from "next/link";

import ForgeLogo from "@/components/ForgeLogo";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  updatedAt: string;
  sections: LegalSection[];
  returnHref?: string;
};

export default function LegalPageShell({
  eyebrow,
  title,
  introduction,
  updatedAt,
  sections,
  returnHref = "/",
}: LegalPageShellProps) {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-slate-50 px-5 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_8%,rgba(37,99,235,0.13),transparent_30%),radial-gradient(circle_at_88%_36%,rgba(14,165,233,0.09),transparent_28%)] dark:bg-[radial-gradient(circle_at_15%_8%,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_88%_36%,rgba(14,165,233,0.10),transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)] dark:opacity-20"
      />

      <div className="mx-auto w-full max-w-4xl">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Retour à l’accueil Forge"
            className="group inline-flex items-center rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900"
          >
            <span className="transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
              <ForgeLogo size={72} />
            </span>
          </Link>

          <Link
            href={returnHref}
            className="forge-back-link rounded-full border border-blue-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm backdrop-blur transition hover:border-blue-400 hover:text-blue-700 dark:border-blue-900 dark:bg-slate-900/70 dark:text-blue-400 dark:hover:border-blue-700 dark:hover:text-blue-300"
          >
            Retour
          </Link>
        </nav>

        <header className="mx-auto max-w-3xl pb-10 pt-16 text-center sm:pb-14 sm:pt-24">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-400">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-slate-600 dark:text-slate-400 sm:text-lg">
            {introduction}
          </p>
          <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
            Dernière mise à jour : {updatedAt}
          </p>
        </header>

        <article className="space-y-4 rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/75 dark:shadow-black/40 sm:p-9">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="rounded-3xl border border-slate-200/75 bg-white/65 p-5 dark:border-slate-700/80 dark:bg-slate-950/45 sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-[-0.025em]">
                    {section.title}
                  </h2>

                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="mt-3 text-pretty leading-7 text-slate-600 dark:text-slate-400"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.items && (
                    <ul className="mt-4 space-y-2 text-slate-600 dark:text-slate-400">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-3 leading-7">
                          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ))}
        </article>

        <footer className="py-10 text-center text-sm text-slate-500 dark:text-slate-500">
          Forge · Pensé pour simplifier le quotidien des artisans
        </footer>
      </div>
    </main>
  );
}
