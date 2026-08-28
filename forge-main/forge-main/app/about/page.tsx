import { ArrowRight, Bot, Gauge, Sparkles } from "lucide-react";
import Link from "next/link";

import ForgeLogo from "@/components/ForgeLogo";

const values = [
  {
    icon: Sparkles,
    title: "Simplicité",
    description:
      "Une interface claire qui laisse l’artisan se concentrer sur son métier.",
  },
  {
    icon: Gauge,
    title: "Rapidité",
    description:
      "Moins d’étapes pour organiser une intervention et préparer les documents utiles.",
  },
  {
    icon: Bot,
    title: "Assistance intelligente",
    description:
      "Un assistant capable de comprendre le texte, la voix et les images pour faciliter le quotidien.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden px-6 py-8 text-slate-950 dark:text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_5%,rgba(37,99,235,0.12),transparent_28%),radial-gradient(circle_at_90%_45%,rgba(14,165,233,0.08),transparent_28%)] dark:bg-[radial-gradient(circle_at_15%_5%,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_90%_45%,rgba(14,165,233,0.08),transparent_28%)]"
      />

      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/app"
          className="inline-flex items-center text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Retour
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/75 dark:shadow-black/40 sm:p-10">
          <header className="mx-auto max-w-2xl text-center">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl" />
              <ForgeLogo size={76} />
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-400">
              À propos de Forge
            </p>
            <h1 className="mt-3 text-balance text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
              Le quotidien des artisans, enfin simplifié.
            </h1>
            <p className="mx-auto mt-5 text-pretty text-lg leading-8 text-slate-600 dark:text-slate-400">
              Forge aide les artisans à gagner du temps au quotidien, de la première demande client jusqu’au suivi administratif final.
            </p>
          </header>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {values.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-3xl border border-slate-200/75 bg-white/65 p-5 dark:border-slate-700/80 dark:bg-slate-950/45"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900">
                  <Icon size={21} />
                </span>
                <h2 className="mt-5 text-lg font-bold">{title}</h2>
                <p className="mt-2 leading-7 text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              </article>
            ))}
          </div>

          <section className="mt-5 rounded-3xl border border-blue-100/80 bg-blue-50/60 p-6 dark:border-blue-900/70 dark:bg-blue-950/35 sm:p-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">
              Notre objectif
            </h2>
            <p className="mt-3 max-w-3xl leading-8 text-slate-600 dark:text-slate-300">
              Réunir les clients, les interventions, les comptes rendus, les devis et les factures dans un environnement unique, fluide et fiable. Forge transforme les tâches administratives répétitives en un parcours naturel, sans éloigner l’artisan de ses décisions professionnelles.
            </p>
          </section>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href="/conditions-generales-utilisation"
              className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950/45 dark:hover:border-blue-700"
            >
              <span>
                <span className="block font-bold">Conditions Générales d’Utilisation</span>
                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                  Les règles d’utilisation de Forge.
                </span>
              </span>
              <ArrowRight size={20} className="shrink-0 text-blue-600 transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="/politique-confidentialite"
              className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950/45 dark:hover:border-blue-700"
            >
              <span>
                <span className="block font-bold">Politique de confidentialité</span>
                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                  Notre approche de la protection des données.
                </span>
              </span>
              <ArrowRight size={20} className="shrink-0 text-blue-600 transition group-hover:translate-x-1" />
            </Link>
          </div>

          <p className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Forge v1.0.0
          </p>
        </section>
      </div>
    </main>
  );
}
