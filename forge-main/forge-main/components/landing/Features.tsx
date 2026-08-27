"use client";

import {
  CalendarDays,
  Camera,
  Check,
  FileText,
  Keyboard,
  Mic,
  Receipt,
  Send,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import ForgeBarPreview from "@/components/landing/ForgeBarPreview";

const features = [
  {
    title: "Interventions",
    description:
      "Créer, modifier et suivre les interventions simplement.",
    eyebrow: "Du planning au terrain",
  },
  {
    title: "Devis",
    description:
      "Créer des devis professionnels rapidement.",
    eyebrow: "Une proposition claire",
  },
  {
    title: "Factures",
    description:
      "Générer et envoyer des factures facilement.",
    eyebrow: "Jusqu’au règlement",
  },
  {
    title: "Assistant IA",
    description:
      "Parler ou écrire naturellement à Forge.",
    eyebrow: "Une interaction naturelle",
  },
];

function FeatureIllustration({
  index,
}: {
  index: number;
}) {
  if (index === 0) {
    return (
      <div className="relative mx-auto w-full max-w-md py-6">
        <div className="absolute left-8 top-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative space-y-3">
          {["09:00", "14:00", "17:30"].map(
            (time, itemIndex) => (
              <div
                key={time}
                className={`flex items-center gap-4 rounded-3xl border bg-white/90 p-4 shadow-lg backdrop-blur transition duration-500 dark:bg-slate-900/90 ${
                  itemIndex === 1
                    ? "ml-6 border-blue-300 shadow-blue-600/10 dark:border-blue-700"
                    : "mr-6 border-slate-200 dark:border-slate-700"
                }`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <CalendarDays size={20} />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-400">{time}</p>
                  <p className="mt-1 font-semibold">Intervention planifiée</p>
                </div>
                <Check size={18} className="text-emerald-500" />
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="relative mx-auto max-w-sm rotate-[-2deg] rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 transition duration-700 hover:rotate-0 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white"><FileText size={20} /></span>
          <span className="text-xs font-bold tracking-[0.16em] text-slate-400">DEVIS</span>
        </div>
        <div className="mt-8 h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="mt-2 h-2 w-4/5 rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-5 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400">Total TTC</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1 240 €</span>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="relative mx-auto flex max-w-md items-center justify-center py-10">
        <div className="absolute h-64 w-64 rounded-full border border-blue-200 dark:border-blue-900" />
        <div className="absolute h-48 w-48 rounded-full border border-blue-300/70 dark:border-blue-800" />
        <div className="relative z-10 rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white"><Receipt size={25} /></span>
          <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">Facture prête</p>
          <p className="mt-1 text-3xl font-bold">840 €</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Send size={15} /> Envoyée
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-md py-8">
      <div className="absolute inset-10 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white"><Sparkles size={20} /></span>
          <div>
            <p className="font-semibold">Assistant Forge</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">À votre écoute</p>
          </div>
        </div>
        <div className="mt-6">
          <ForgeBarPreview text="« Prépare un devis pour Martin… »" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <Check size={16} /> Demande comprise
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visibleItems, setVisibleItems] =
    useState<number[]>([]);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      const frame = window.requestAnimationFrame(() => {
        setVisibleItems(features.map((_, index) => index));
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(
            (entry.target as HTMLElement).dataset.index,
          );
          setVisibleItems((current) =>
            current.includes(index)
              ? current
              : [...current, index],
          );
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.25 },
    );

    const items = section.querySelectorAll(
      "[data-feature-item]",
    );
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden bg-slate-50 py-24 text-slate-950 sm:py-32 dark:bg-slate-950 dark:text-white"
    >
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Tout votre quotidien</p>
        <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Une seule expérience, du premier appel au paiement.</h2>
      </div>

      <div className="mx-auto mt-20 max-w-7xl">
        {features.map((feature, index) => {
          const isVisible = visibleItems.includes(index);
          const isReversed = index % 2 === 1;

          return (
            <article
              key={feature.title}
              data-feature-item
              data-index={index}
              className="relative grid min-h-[34rem] items-center gap-12 border-t border-slate-200 px-6 py-20 last:border-b dark:border-slate-800 lg:grid-cols-2 lg:px-12"
            >
              <div className={`transition-all duration-1000 motion-reduce:transition-none ${isReversed ? "lg:order-2" : ""} ${isVisible ? "translate-x-0 opacity-100" : isReversed ? "translate-x-10 opacity-0" : "-translate-x-10 opacity-0"}`}>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">0{index + 1} · {feature.eyebrow}</p>
                <h3 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{feature.title}</h3>
                <p className="mt-6 max-w-xl text-xl leading-8 text-slate-600 dark:text-slate-300">{feature.description}</p>
                {index === 3 && (
                  <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <Camera size={20} className="text-blue-600 dark:text-blue-400" />
                      <p className="mt-3 font-semibold">Photo</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Envoyez l’image d’une installation, d’une panne, d’une chaudière, d’un document ou d’un élément chez le client. Forge l’analyse pour aider à créer une intervention, un devis ou un suivi client.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <Mic size={20} className="text-blue-600 dark:text-blue-400" />
                      <p className="mt-3 font-semibold">Voix</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Parlez naturellement à Forge.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <Keyboard size={20} className="text-blue-600 dark:text-blue-400" />
                      <p className="mt-3 font-semibold">Texte</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Écrivez simplement votre demande.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className={`transition-all delay-150 duration-1000 motion-reduce:transition-none ${isReversed ? "lg:order-1" : ""} ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
                <FeatureIllustration index={index} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
