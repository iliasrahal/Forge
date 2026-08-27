"use client";

import {
  CalendarClock,
  Clock3,
  FileText,
  Users,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

const challenges = [
  {
    title: "Temps perdu dans l’administratif",
    description:
      "Les tâches répétitives empiètent sur le temps passé sur le terrain.",
    icon: Clock3,
  },
  {
    title: "Devis longs à préparer",
    description:
      "Chaque proposition demande de reprendre et organiser les mêmes informations.",
    icon: FileText,
  },
  {
    title: "Interventions difficiles à suivre",
    description:
      "Les rendez-vous, reports et comptes rendus se dispersent rapidement.",
    icon: CalendarClock,
  },
  {
    title: "Gestion client compliquée",
    description:
      "Retrouver le bon contact et son historique ne devrait jamais ralentir un chantier.",
    icon: Users,
  },
];

export default function Problem() {
  const sectionRef =
    useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] =
    useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      setIsVisible(true);
      return;
    }

    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.18,
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white px-6 py-24 text-slate-950 sm:py-32 lg:px-8 dark:bg-slate-950 dark:text-white"
    >
      <div className="pointer-events-none absolute left-[-10rem] top-1/3 -z-10 h-80 w-80 rounded-full bg-slate-200/70 blur-3xl dark:bg-slate-800/60" />

      <div className="mx-auto max-w-6xl">
        <div
          className={`mx-auto max-w-3xl text-center transition-all duration-700 motion-reduce:transition-none ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            Les défis des artisans
          </p>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
            Le métier est déjà exigeant. La gestion ne devrait pas l’être aussi.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Avant Forge, trop de temps disparaît entre les appels, les documents et le suivi quotidien.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {challenges.map(
            (
              {
                title,
                description,
                icon: Icon,
              },
              index,
            ) => (
              <article
                key={title}
                style={{
                  transitionDelay: `${
                    100 + index * 90
                  }ms`,
                }}
                className={`group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-700 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/5 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:shadow-black/20 sm:p-8 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-700 dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-300">
                  <Icon size={22} />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-white">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              </article>
            ),
          )}
        </div>

        <div
          style={{ transitionDelay: "520ms" }}
          className={`mx-auto mt-16 max-w-3xl border-t border-slate-200 pt-14 text-center transition-all duration-700 motion-reduce:transition-none dark:border-slate-800 ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <p className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Forge change la façon de travailler.
          </p>
          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600" />
        </div>
      </div>
    </section>
  );
}
