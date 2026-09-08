"use client";

import { Clock3, Mic, ReceiptText, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const pillars = [
  {
    icon: Clock3,
    title: "Temps passé",
    description: "Suivez les heures réellement passées sur chaque chantier, seul ou en équipe.",
    content: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Mohamed</span><strong>38 h</strong></div>
        <div className="flex justify-between"><span>Ilias</span><strong>32 h</strong></div>
        <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700"><span>Total</span><strong className="text-blue-700 dark:text-blue-300">70 h</strong></div>
      </div>
    ),
  },
  {
    icon: ReceiptText,
    title: "Dépenses",
    description: "Enregistrez les matériaux, fournitures, déplacements et autres dépenses directement sur le chantier.",
    content: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Matériaux</span><strong>1 680 €</strong></div>
        <div className="flex justify-between"><span>Déplacement</span><strong>120 €</strong></div>
        <div className="flex justify-between"><span>Location</span><strong>300 €</strong></div>
        <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700"><span>Total</span><strong className="text-blue-700 dark:text-blue-300">2 100 €</strong></div>
      </div>
    ),
  },
  {
    icon: TrendingUp,
    title: "Rentabilité",
    description: "Comparez simplement ce que le chantier vous rapporte avec ce qu’il vous coûte réellement.",
    content: (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Chiffre d’affaires</span><strong>8 000 €</strong></div>
        <div className="flex justify-between"><span>Coûts</span><strong>3 850 €</strong></div>
        <div className="flex justify-between border-t border-emerald-200 pt-2 dark:border-emerald-800"><span>Marge</span><strong className="text-emerald-700 dark:text-emerald-300">4 150 €</strong></div>
      </div>
    ),
  },
];

export default function JobProfitability() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setIsVisible(true);
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const reveal = isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0";

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white px-6 py-24 text-slate-950 dark:bg-slate-950 dark:text-white sm:py-32 lg:px-8">
      <div className="pointer-events-none absolute left-[-8rem] top-24 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl dark:bg-pink-700/15" />
      <div className="pointer-events-none absolute right-[-7rem] top-1/3 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-700/20" />

      <div className="relative mx-auto max-w-7xl">
        <div className={`landing-reveal-motion mx-auto max-w-4xl text-center duration-700 motion-reduce:transition-none ${reveal}`}>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Suivi du chantier</p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Sachez ce que vous rapporte vraiment chaque chantier.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">Suivez le temps passé et les dépenses de votre chantier. Forge vous aide à visualiser son coût réel et sa rentabilité.</p>
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className={`landing-reveal-motion duration-1000 motion-reduce:transition-none ${reveal}`}>
            <div className="relative overflow-hidden rounded-[2rem] border border-blue-200/80 bg-white/75 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur-xl dark:border-blue-800/70 dark:bg-slate-900/70 sm:p-7">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-700/80">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Chantier Dupont</p>
                  <p className="mt-2 text-xl font-bold sm:text-2xl">Rénovation salle de bain</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Rentable</span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  ["Chiffre d’affaires", "8 000 €"],
                  ["Dépenses", "2 100 €"],
                  ["Main-d’œuvre", "1 750 €"],
                  ["Temps passé", "70 h"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200/80 bg-white/65 p-4 dark:border-slate-700/80 dark:bg-slate-950/45">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 to-blue-50 p-5 dark:border-emerald-800/80 dark:from-emerald-950/55 dark:to-blue-950/55">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Marge réelle</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Après dépenses et main-d’œuvre</p></div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 sm:text-3xl">4 150 €</p>
                </div>
              </div>

              <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-3 font-semibold text-violet-800 dark:border-violet-900 dark:bg-violet-950/45 dark:text-violet-200">« Ajoute 180 € de matériaux au chantier Dupont. »</div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3 font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/45 dark:text-blue-200">« J’ai travaillé 7 heures aujourd’hui sur ce chantier. »</div>
              </div>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"><Mic size={14} /> À l’écrit comme à l’oral</p>
            </div>
          </div>

          <div className="grid gap-4">
            {pillars.map(({ icon: Icon, title, description, content }, index) => (
              <article key={title} style={{ transitionDelay: `${150 + index * 120}ms` }} className={`landing-reveal-motion rounded-[1.75rem] border border-slate-200 bg-white/70 p-5 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.5)] backdrop-blur duration-700 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900/65 sm:p-6 ${reveal}`}>
                <div className="flex items-start gap-4">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${index === 2 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}`}><Icon size={20} /></span>
                  <div className="min-w-0 flex-1"><h3 className="text-lg font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p></div>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50/85 p-4 text-slate-700 dark:bg-slate-950/65 dark:text-slate-200">{content}</div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
