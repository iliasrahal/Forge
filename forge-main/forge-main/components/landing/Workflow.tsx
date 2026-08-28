"use client";

import { ArrowRight, Check, FileText, Keyboard, Mail, Mic, Receipt, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const reportSections = [
  "Intervention réalisée",
  "Diagnostic",
  "Travaux effectués",
  "Recommandation",
];

export default function Workflow() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const revealClass = isVisible
    ? "translate-y-0 opacity-100"
    : "translate-y-8 opacity-0";

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white px-6 py-24 text-slate-950 sm:py-32 lg:px-8 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[70rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-950/35" />

      <div className="mx-auto max-w-7xl">
        <div className={`mx-auto max-w-3xl text-center transition-all duration-700 motion-reduce:transition-none ${revealClass}`}>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Après l’intervention</p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Du terrain au document envoyé, sans rupture.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-slate-600 dark:text-slate-300">
            Après votre intervention, Forge transforme simplement vos informations en documents professionnels : compte rendu, facture, devis et envoi au client.
          </p>
        </div>

        <div className="relative mt-16 grid gap-5 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-9 hidden h-px bg-gradient-to-r from-blue-200 via-blue-500 to-blue-200 dark:from-blue-900 dark:via-blue-600 dark:to-blue-900 lg:block" />

          <article style={{ transitionDelay: "80ms" }} className={`relative rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.55)] backdrop-blur transition-all duration-700 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900/90 ${revealClass}`}>
            <span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Wrench size={24} /></span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">01 · Intervention</p>
            <h3 className="mt-2 text-xl font-bold">Intervention terminée</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">L’artisan indique simplement ce qui a été réalisé chez le client, à la voix ou à l’écrit.</p>
            <blockquote className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm italic leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
              « J’ai remplacé le robinet, réparé la fuite et vérifié l’installation. »
            </blockquote>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Mic size={13} /> Voix</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Keyboard size={13} /> Texte</span>
            </div>
          </article>

          <article style={{ transitionDelay: "180ms" }} className={`relative rounded-[2rem] border border-blue-200 bg-white/95 p-6 shadow-[0_28px_80px_-38px_rgba(37,99,235,0.4)] backdrop-blur transition-all duration-700 motion-reduce:transition-none dark:border-blue-900 dark:bg-slate-900/95 ${revealClass}`}>
            <span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900"><FileText size={24} /></span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">02 · Compte rendu</p>
            <h3 className="mt-2 text-xl font-bold">Généré automatiquement</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Forge structure automatiquement l’intervention avec :</p>
            <div className="mt-5 space-y-2.5">
              {reportSections.map((label) => (
                <div key={label} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Check size={12} /></span>
                  {label}
                </div>
              ))}
            </div>
          </article>

          <article style={{ transitionDelay: "280ms" }} className={`relative rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.55)] backdrop-blur transition-all duration-700 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900/90 ${revealClass}`}>
            <span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Receipt size={24} /></span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">03 · Facture</p>
            <h3 className="mt-2 text-xl font-bold">La suite administrative</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">À partir des informations de l’intervention, Forge prépare les documents nécessaires comme la facture ou le devis.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">Facture</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Devis</span>
            </div>
          </article>

          <article style={{ transitionDelay: "380ms" }} className={`relative rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.55)] backdrop-blur transition-all duration-700 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900/90 ${revealClass}`}>
            <span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Mail size={24} /></span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">04 · Envoi</p>
            <h3 className="mt-2 text-xl font-bold">Envoyé au client</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Les documents professionnels sont prêts à être envoyés facilement au client.</p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"><Check size={18} /> Document prêt à envoyer</div>
          </article>
        </div>

        <div style={{ transitionDelay: "500ms" }} className={`mx-auto mt-10 flex w-fit flex-wrap items-center justify-center gap-3 rounded-full border border-blue-200 bg-blue-50/80 px-5 py-3 text-center text-sm font-semibold text-blue-700 transition-all duration-700 motion-reduce:transition-none dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300 ${revealClass}`}>
          Intervention <ArrowRight size={15} /> Compte rendu <ArrowRight size={15} /> Facture <ArrowRight size={15} /> Email
        </div>
      </div>
    </section>
  );
}
