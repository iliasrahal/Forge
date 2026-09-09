"use client";

import {
  BellRing,
  CheckCircle2,
  FileCheck2,
  FileClock,
  ReceiptText,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const reminderExamples = [
  {
    icon: FileCheck2,
    label: "Devis",
    detail: "Prêt mais pas encore envoyé",
    action: "Envoyer",
  },
  {
    icon: FileClock,
    label: "Devis",
    detail: "Sans réponse depuis 3 jours",
    action: "Relancer",
  },
  {
    icon: Wrench,
    label: "Intervention",
    detail: "Terminée et prête à facturer",
    action: "Créer la facture",
  },
  {
    icon: ReceiptText,
    label: "Facture",
    detail: "Arrivée à échéance",
    action: "Voir",
  },
];

export default function SmartReminders() {
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
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      { threshold: 0.25 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"
    >
      <div className="landing-section-spacing mx-auto grid max-w-7xl items-center gap-12 border-b border-slate-200 px-6 dark:border-slate-800 lg:grid-cols-2 lg:px-12">
        <div
          className={`landing-reveal-motion duration-1000 motion-reduce:transition-none lg:order-2 ${
            isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            06 · Rappels intelligents
          </p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Ne laissez plus passer les actions importantes.
          </h2>
          <p className="mt-6 max-w-xl text-xl leading-8 text-slate-600 dark:text-slate-300">
            Activez les rappels intelligents et Forge vous aide à repérer les
            devis à envoyer ou à relancer, les interventions à facturer et les
            factures qui nécessitent votre attention.
          </p>
          <div className="mt-8 flex max-w-xl items-start gap-3 rounded-2xl border border-blue-200/70 bg-blue-50/65 px-4 py-4 text-sm font-semibold leading-6 text-blue-800 backdrop-blur dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-200">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <p>
              Vous gardez le contrôle : activez ou désactivez les rappels depuis
              vos Options. Forge vous signale l’action, vous décidez de l’effectuer.
            </p>
          </div>
        </div>

        <div
          className={`landing-reveal-motion relative mx-auto w-full max-w-md duration-1000 motion-reduce:transition-none ${
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
          }`}
        >
          <div className="absolute inset-10 rounded-full bg-pink-400/20 blur-3xl" />
          <div className="relative rounded-[2rem] border border-blue-200/70 bg-white/70 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur-xl dark:border-blue-800/60 dark:bg-slate-900/70 sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-200/80 pb-5 dark:border-slate-700/80">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-pink-500 text-white shadow-lg shadow-blue-600/20">
                <BellRing size={20} />
              </span>
              <div>
                <p className="font-bold">À ne pas oublier</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Seulement lorsque vous l’activez
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {reminderExamples.map(({ icon: Icon, label, detail, action }) => (
                <div
                  key={`${label}-${detail}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/65 p-3.5 dark:border-slate-700/80 dark:bg-slate-950/45"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{label}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {detail}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-xl border border-blue-300/70 px-2.5 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-700 dark:text-blue-300">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
