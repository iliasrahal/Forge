import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import ForgeSymbol from "@/components/ForgeSymbol";
import { FORGE_PRICING } from "@/src/lib/pricing";

const forgeOffer = FORGE_PRICING.SOLO;

export default function Pricing() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-50 px-6 py-24 text-slate-950 sm:py-32 lg:px-8 dark:bg-slate-900/40 dark:text-white">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[42rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/55 blur-3xl dark:bg-blue-950/45" />

      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            08 · Tarifs Forge
          </p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Un assistant professionnel accessible
          </h2>
          <p className="mt-6 text-xl font-semibold text-blue-700 dark:text-blue-300">
            1 mois offert pour découvrir Forge
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Après votre période d’essai, Forge est disponible à 29,99 € / mois
            par utilisateur disposant d’un accès complet.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-3xl">
          <div className="pointer-events-none absolute inset-x-10 top-8 -z-10 h-72 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-600/20" />

          <article className="overflow-hidden rounded-[2.25rem] border border-blue-200/80 bg-white/90 shadow-[0_32px_100px_-38px_rgba(37,99,235,0.42)] backdrop-blur-xl dark:border-blue-900 dark:bg-slate-900/90">
            <div className="border-b border-slate-100 px-6 py-7 text-center dark:border-slate-800 sm:px-8">
              <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <ForgeSymbol size={17} /> 1 mois offert
              </span>
              <div className="mx-auto mt-6 max-w-md rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-6 shadow-[0_20px_50px_-24px_rgba(37,99,235,0.8)] ring-1 ring-inset ring-white/15 dark:from-blue-500 dark:to-blue-700 dark:shadow-[0_22px_55px_-26px_rgba(59,130,246,0.65)] dark:ring-white/20 sm:px-7 sm:py-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100 dark:text-blue-50">
                  Forge
                </p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {forgeOffer.amount}
                </p>
                <p className="mt-1 text-sm font-semibold text-blue-100 dark:text-blue-50/85">
                  / mois
                </p>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-8 sm:py-8">
              <Link
                href="/register"
                className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30"
              >
                Commencer gratuitement
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                <p className="flex items-center justify-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                  <ShieldCheck size={17} className="text-emerald-600 dark:text-emerald-400" />
                  Aucun engagement nécessaire
                </p>
                <p className="mt-2 text-center">
                  Vous pouvez souscrire avant la fin du mois offert si vous souhaitez continuer avec Forge.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
