import Link from "next/link";
import {
  ArrowRight,
  Check,
} from "lucide-react";

import ForgeLogo from "@/components/ForgeLogo";
import ForgeSymbol from "@/components/ForgeSymbol";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-96 bg-[radial-gradient(circle_at_bottom,#dbeafe,transparent_68%)] dark:bg-[radial-gradient(circle_at_bottom,#172554,transparent_68%)]" />

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-blue-400/20 bg-[linear-gradient(135deg,#172554_0%,#1d4ed8_52%,#2563eb_100%)] px-6 py-16 text-center text-white shadow-[0_35px_100px_-35px_rgba(37,99,235,0.65)] sm:px-12 sm:py-20 lg:px-20 lg:py-24 dark:border-blue-500/20 dark:bg-[linear-gradient(135deg,#020617_0%,#172554_48%,#1e40af_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-blue-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          <div className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-2 pr-4 shadow-xl backdrop-blur">
            <span className="overflow-hidden rounded-xl bg-white shadow-lg shadow-slate-950/20 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <ForgeLogo size={44} />
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-blue-50">
              <ForgeSymbol
                size={18}
                className="rounded-md bg-white/90 p-0.5"
              />
              Passez à Forge
            </span>
          </div>

          <h2 className="text-balance text-4xl font-bold tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            Prêt à transformer votre façon de travailler ?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            Rejoignez un espace conçu pour simplifier le quotidien des artisans, du premier contact à la facture finale.
          </p>

          <Link
            href="/register"
            className="group mt-10 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 font-semibold text-blue-700 shadow-2xl shadow-slate-950/20 transition hover:-translate-y-1 hover:bg-blue-50 hover:shadow-slate-950/30"
          >
            Créer mon espace gratuitement
            <ArrowRight
              size={19}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-blue-100">
            <span className="inline-flex items-center gap-2">
              <Check size={16} /> Mise en route rapide
            </span>
            <span className="inline-flex items-center gap-2">
              <Check size={16} /> Pensé pour le terrain
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
