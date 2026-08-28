"use client";

import {
  Building2,
  Check,
  Keyboard,
  Mail,
  MapPin,
  Mic,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

const benefits = [
  "Création par commande vocale ou écrite",
  "Ajout automatique des informations client",
  "Fonctionne pour les particuliers et les professionnels",
  "Création d’une fiche client en quelques secondes",
];

const clientDetails = [
  {
    icon: UserRound,
    label: "Nom / prénom",
    value: "Charles Xavier",
  },
  {
    icon: Phone,
    label: "Téléphone",
    value: "06 XX XX XX XX",
  },
  {
    icon: Mail,
    label: "Email",
    value: "charles@email.com",
  },
  {
    icon: MapPin,
    label: "Adresse",
    value: "12 rue Exemple",
  },
  {
    icon: Building2,
    label: "Ville",
    value: "Paris",
  },
];

export default function ClientCreation() {
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
      { threshold: 0.15 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const revealClass = isVisible
    ? "translate-y-0 opacity-100"
    : "translate-y-8 opacity-0";

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-white px-6 py-24 text-slate-950 sm:py-32 lg:px-8 dark:bg-slate-950 dark:text-white"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[42rem] w-[62rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-950/35" />

      <div className="mx-auto max-w-7xl">
        <div
          className={`mx-auto max-w-3xl text-center transition-all duration-700 motion-reduce:transition-none ${revealClass}`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            03 · Gestion client instantanée
          </p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Créez vos fiches clients instantanément
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-pretty text-lg leading-8 text-slate-600 dark:text-slate-300">
            Plus besoin de remplir les formulaires manuellement. Dites simplement à Forge ce dont vous avez besoin, à l’écrit ou à la voix, et votre fiche client est créée automatiquement.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div
            className={`transition-all delay-100 duration-1000 motion-reduce:transition-none ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 opacity-0"
            }`}
          >
            <div className="rounded-[2rem] border border-slate-200/90 bg-white/85 p-5 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <Mic size={20} />
                </span>
                <div>
                  <p className="font-semibold">Demande à Forge</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    À l’écrit ou à la voix
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl rounded-tl-lg bg-slate-100/90 p-5 text-sm leading-7 text-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:text-base">
                <p>Crée-moi un client Charles Xavier.</p>
                <p>Téléphone : 06 XX XX XX XX.</p>
                <p>Email : charles@email.com.</p>
                <p>Adresse : 12 rue Exemple.</p>
                <p>Ville : Paris.</p>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                  <Check size={15} />
                </span>
                Fiche client créée avec succès
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-2 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
                <Mic size={14} /> Voix
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                <Keyboard size={14} /> Texte
              </span>
            </div>
          </div>

          <div
            className={`relative transition-all delay-200 duration-1000 motion-reduce:transition-none ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="pointer-events-none absolute inset-x-12 top-8 -z-10 h-56 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-600/15" />
            <div className="rounded-[2rem] border border-blue-100 bg-white/95 p-6 shadow-[0_30px_100px_-38px_rgba(37,99,235,0.35)] dark:border-blue-900 dark:bg-slate-900/95 sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <UserRound size={21} />
                  </span>
                  <div>
                    <p className="font-bold">Fiche client</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Créée automatiquement
                    </p>
                  </div>
                </div>
                <Sparkles className="text-blue-600 dark:text-blue-400" size={20} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {clientDetails.map(({ icon: Icon, label, value }, index) => (
                  <div
                    key={label}
                    className={`rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/75 ${
                      index === 0 ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <Icon size={15} />
                      <p className="text-xs font-bold uppercase tracking-[0.12em]">
                        {label}
                      </p>
                    </div>
                    <p className="mt-2 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div
              key={benefit}
              style={{ transitionDelay: `${350 + index * 80}ms` }}
              className={`flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-4 text-sm font-semibold shadow-sm backdrop-blur transition-all duration-700 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900/70 ${revealClass}`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Check size={15} />
              </span>
              {benefit}
            </div>
          ))}
        </div>

        <div
          className={`mx-auto mt-10 max-w-4xl rounded-3xl border border-blue-100 bg-blue-50/65 px-6 py-5 text-center text-sm leading-7 text-blue-900 transition-all delay-500 duration-700 motion-reduce:transition-none dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-200 ${revealClass}`}
        >
          Forge comprend aussi les demandes simples comme :
          <span className="font-semibold"> « Crée un client avec uniquement son nom et son numéro »</span>
          {" ou "}
          <span className="font-semibold">« Ajoute cette entreprise avec son adresse et son email »</span>.
        </div>
      </div>
    </section>
  );
}
