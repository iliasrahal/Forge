"use client";

import {
  Check,
  CreditCard,
  ReceiptText,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const benefits = [
  {
    icon: ReceiptText,
    text: "Ajoutez un lien de paiement lorsque vous envoyez votre facture.",
  },
  {
    icon: CreditCard,
    text: "Votre client règle simplement en ligne, par carte ou par virement.",
  },
  {
    icon: RefreshCw,
    text: "Forge reconnaît l’encaissement et actualise automatiquement la facture.",
  },
];

export default function Payments() {
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
      <div className="mx-auto grid min-h-[34rem] max-w-7xl items-center gap-12 border-b border-slate-200 px-6 py-20 dark:border-slate-800 lg:grid-cols-2 lg:px-12">
        <div
          className={`landing-reveal-motion duration-1000 motion-reduce:transition-none ${
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            05 · Paiements en ligne
          </p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            De la facture à l’encaissement, sans ressaisie.
          </h2>
          <p className="mt-6 max-w-xl text-xl leading-8 text-slate-600 dark:text-slate-300">
            Envoyez votre facture avec un lien de paiement. Une fois le règlement
            reconnu, Forge met automatiquement son suivi à jour.
          </p>

          <div className="mt-8 grid max-w-xl gap-3">
            {benefits.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Icon size={17} />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div
          className={`landing-reveal-motion relative mx-auto w-full max-w-md duration-1000 motion-reduce:transition-none ${
            isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
          }`}
        >
          <div className="absolute inset-10 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-blue-200/70 bg-white/75 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur-xl dark:border-blue-800/60 dark:bg-slate-900/70 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Facture F2026-000042
                </p>
                <p className="mt-2 text-3xl font-bold">840,00 €</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <WalletCards size={23} />
              </span>
            </div>

            <div className="mt-7 rounded-2xl border border-blue-200/70 bg-blue-50/75 p-4 dark:border-blue-800/60 dark:bg-blue-950/45">
              <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                Paiement en ligne envoyé
              </p>
              <p className="mt-1 text-sm text-blue-700/80 dark:text-blue-300/80">
                Le client dispose de son lien sécurisé.
              </p>
            </div>

            <div className="my-3 flex justify-center text-blue-500">
              <RefreshCw size={19} />
            </div>

            <div className="rounded-2xl border border-emerald-300/70 bg-emerald-50/80 p-4 dark:border-emerald-800/70 dark:bg-emerald-950/45">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                <Check size={17} /> Paiement reconnu
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Encaissé</p>
                  <p className="mt-1 font-bold text-slate-950 dark:text-white">840,00 €</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reste dû</p>
                  <p className="mt-1 font-bold text-slate-950 dark:text-white">0,00 €</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
