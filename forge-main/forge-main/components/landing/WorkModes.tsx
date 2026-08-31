"use client";

import {
  Check,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

const workModes = [
  {
    title: "Votre espace personnel",
    description:
      "Chaque compte Forge dispose de son propre espace Personnel, séparé des espaces partagés. Vous pouvez continuer à travailler seul, sans créer d’équipe.",
    icon: UserRound,
    benefits: [
      "Vos interventions, clients et planning au même endroit",
      "Vos devis et factures restent dans votre espace",
      "Un espace personnel qui vous appartient",
    ],
  },
  {
    title: "Travaillez aussi en équipe",
    description:
      "Créez un espace partagé pour votre entreprise ou rejoignez une équipe sur invitation, puis passez facilement de votre espace Personnel à vos espaces Équipe.",
    icon: UsersRound,
    benefits: [
      "Créez votre espace partagé et devenez propriétaire de l’équipe",
      "Invitez vos collaborateurs par e-mail dans leur propre compte Forge",
      "Lecture seule gratuite pour consulter les informations de l’équipe",
      "Accès complet avec un abonnement Forge personnel à 29,99 € / mois après le mois d’essai",
    ],
  },
];

export default function WorkModes() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
    ) {
      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-white px-6 py-24 text-slate-950 dark:bg-slate-950 dark:text-white sm:py-32 lg:px-8"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[38rem] w-[58rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/65 blur-3xl dark:bg-blue-950/35" />

      <div className="mx-auto max-w-6xl">
        <div
          className={`landing-reveal-motion mx-auto max-w-3xl text-center duration-700 motion-reduce:transition-none ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            07 · Votre organisation
          </p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Commencez seul. Travaillez en équipe quand vous en avez besoin.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-600 dark:text-slate-300">
            Retrouvez toujours votre espace Personnel, puis créez ou rejoignez
            des espaces Équipe pour partager clients, interventions, documents
            et planning avec vos collaborateurs.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {workModes.map(
            ({ title, description, icon: Icon, benefits }, index) => (
              <article
                key={title}
                style={{ transitionDelay: `${150 + index * 120}ms` }}
                className={`landing-reveal-motion rounded-[2rem] border border-slate-200/90 bg-white/85 p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl duration-700 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_32px_100px_-48px_rgba(37,99,235,0.32)] motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-blue-800 sm:p-8 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Icon size={22} />
                </span>

                <h3 className="mt-6 text-2xl font-bold tracking-tight">
                  {title}
                </h3>
                <p className="mt-4 min-h-20 leading-7 text-slate-600 dark:text-slate-300">
                  {description}
                </p>

                <div className="mt-7 space-y-3 border-t border-slate-200/80 pt-6 dark:border-slate-800">
                  {benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200"
                    >
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <Check size={15} />
                      </span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
