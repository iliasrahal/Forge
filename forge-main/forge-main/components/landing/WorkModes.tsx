"use client";

import {
  BriefcaseBusiness,
  Check,
  MapPin,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { FORGE_PRICING } from "@/src/lib/pricing";

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
      "Planning, interventions et chantiers partagés",
      "Affectez les membres et les responsables de tâches",
      "Suivez le temps passé par membre",
      "Invitez aussi des collaborateurs en consultation seule",
      `Accès complet avec un abonnement Forge personnel à ${FORGE_PRICING.monthlyLabel} après le mois d’essai`,
    ],
  },
];

const ecosystemItems = [
  "Planning", "Interventions", "Chantiers", "Clients", "Comptes rendus",
  "Devis", "Bibliothèque métier", "Stock", "Factures", "Paiements", "Temps",
  "Fournisseurs", "Achats", "Dépenses", "Rentabilité", "Statistiques", "Relances", "Réponses clients",
  "Chantiers disponibles",
  "Personnel", "Équipe",
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
      className="landing-section-spacing relative isolate overflow-hidden bg-white px-6 text-slate-950 dark:bg-slate-950 dark:text-white lg:px-8"
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
            Publiez aussi un chantier ou découvrez les missions proposées par
            d’autres artisans du réseau Forge.
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

        <div
          className={`landing-reveal-motion mt-10 grid gap-6 rounded-[2rem] border border-violet-200/80 bg-white/75 p-5 shadow-[0_28px_90px_-52px_rgba(76,110,245,0.55)] backdrop-blur-xl duration-700 motion-reduce:transition-none dark:border-violet-900/80 dark:bg-slate-900/70 sm:p-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <div className="text-center lg:text-left">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 lg:mx-0">
              <BriefcaseBusiness size={22} />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              Réseau privé Forge
            </p>
            <h3 className="mt-3 text-balance text-3xl font-bold tracking-tight">
              Trouvez du renfort. Trouvez des chantiers.
            </h3>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              Publiez un chantier lorsque vous avez besoin de renfort ou
              découvrez les chantiers proposés par d’autres artisans Forge.
              Recherchez plusieurs métiers, suivez l’intérêt porté à vos
              annonces et les demandes reçues, puis composez votre équipe.
            </p>
            <p className="mt-4 text-sm font-semibold text-blue-700 dark:text-blue-300">
              Consultation, publication et demandes sont comprises pendant le mois d’essai.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/90 bg-white/90 p-4 shadow-[0_22px_65px_-42px_rgba(15,23,42,0.5)] dark:border-slate-700 dark:bg-slate-950/80 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Chantiers disponibles
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                Publier un chantier
              </span>
            </div>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/45 p-4 text-left dark:border-blue-900 dark:bg-blue-950/25">
              <p className="font-bold text-slate-950 dark:text-white">
                Rénovation d’un appartement
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
                <MapPin size={15} /> Saint-Denis
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Plombier ×2 · 1 → 10 oct.
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Chauffagiste ×1 · 8 → 15 oct.
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Électricien ×1 · 20 → 25 oct.
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Trouvez les bons artisans, au bon moment.
              </p>
              <span className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-blue-300 px-4 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300">
                Voir le chantier
              </span>
            </div>
            <div className="mt-4 flex flex-col items-stretch justify-center gap-2 text-center text-xs font-semibold sm:flex-row sm:items-center">
              <span className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">Demander à rejoindre</span>
              <span className="rotate-90 text-blue-500 sm:rotate-0" aria-hidden="true">→</span>
              <span className="rounded-xl bg-blue-50 px-3 py-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Demande envoyée</span>
              <span className="rotate-90 text-blue-500 sm:rotate-0" aria-hidden="true">→</span>
              <span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Acceptée</span>
            </div>
          </div>
        </div>

        <div className={`landing-reveal-motion mt-10 rounded-[2rem] border border-blue-200/80 bg-white/70 p-5 text-center shadow-[0_24px_80px_-48px_rgba(37,99,235,0.5)] backdrop-blur-xl duration-700 motion-reduce:transition-none dark:border-blue-900 dark:bg-slate-900/65 sm:p-7 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Tout Forge, au même endroit</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {ecosystemItems.map((item) => <span key={item} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${item === "Bibliothèque métier" || item === "Statistiques" || item === "Chantiers disponibles" ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300" : "border-slate-200 bg-white/70 text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300"}`}>{item}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}
