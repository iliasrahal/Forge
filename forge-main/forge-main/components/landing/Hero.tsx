import Link from "next/link";
import {
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

import ForgeLogo from "@/components/ForgeLogo";
import ForgeBarPreview from "@/components/landing/ForgeBarPreview";
import LandingLoginLink from "@/components/landing/LandingLoginLink";

export default function Hero() {
  return (
    <section className="relative isolate min-h-dvh overflow-hidden border-b border-slate-200 bg-white text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
      <style>{`
        @keyframes forge-hero-reveal {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes forge-hero-float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }
        @keyframes forge-hero-glow {
          0%, 100% { opacity: .45; transform: scale(1); }
          50% { opacity: .75; transform: scale(1.08); }
        }
        .forge-hero-reveal { animation: forge-hero-reveal .8s cubic-bezier(.22, 1, .36, 1) both; }
        .forge-hero-delay-1 { animation-delay: .1s; }
        .forge-hero-delay-2 { animation-delay: .2s; }
        .forge-hero-delay-3 { animation-delay: .3s; }
        .forge-hero-float { animation: forge-hero-float 6s ease-in-out infinite; }
        .forge-hero-glow { animation: forge-hero-glow 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .forge-hero-reveal, .forge-hero-float, .forge-hero-glow { animation: none; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_75%)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] dark:opacity-40" />
      <div className="forge-hero-glow pointer-events-none absolute left-1/2 top-[-18rem] -z-20 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-blue-400/25 blur-[110px] dark:bg-blue-700/25" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link
          href="/"
          aria-label="Accueil Forge"
          className="flex items-center"
        >
          <span className="transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02]">
            <ForgeLogo size={64} />
          </span>
        </Link>

        <LandingLoginLink
          className="rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-600 dark:hover:text-blue-300"
        >
          Se connecter
        </LandingLoginLink>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-28 pt-14 text-center sm:pt-20 lg:px-8 lg:pb-36">
        <div className="forge-hero-reveal relative mb-8">
          <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="rounded-[2rem] bg-white p-2 shadow-2xl shadow-blue-600/20 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <ForgeLogo size={96} />
          </div>
        </div>

        <p className="forge-hero-reveal forge-hero-delay-1 text-sm font-bold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-400">
          Forge
        </p>

        <h1 className="forge-hero-reveal forge-hero-delay-1 mt-6 max-w-5xl text-balance text-5xl font-bold tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
          La solution intelligente pour les artisans.
        </h1>

        <p className="forge-hero-reveal forge-hero-delay-2 mt-7 max-w-3xl text-balance text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
          De la demande client à la facture, Forge simplifie votre quotidien.
        </p>

        <div className="forge-hero-reveal forge-hero-delay-3 mt-10 flex w-full max-w-sm justify-center">
          <Link
            href="/register"
            className="group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 font-semibold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/35"
          >
            Créer mon espace gratuitement
            <ArrowRight
              size={18}
              className="transition group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="forge-hero-reveal forge-hero-delay-3 relative mt-20 w-full max-w-4xl sm:mt-24">
          <div className="absolute inset-x-12 top-8 -z-10 h-56 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-600/20" />

          <div className="forge-hero-float relative mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/75 p-3 shadow-[0_30px_100px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/75">
            <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 text-left dark:border-slate-700 dark:bg-slate-950 sm:p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                    <Sparkles size={19} />
                  </span>
                  <div>
                    <p className="font-semibold">Assistant Forge</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Votre activité, simplement</p>
                  </div>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 sm:flex">
                  <Check size={13} /> Prêt
                </span>
              </div>

              <div className="mt-7">
                <ForgeBarPreview text="« Crée une intervention demain à 10 h… »" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
