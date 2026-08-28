"use client";

import {
  Building2,
  Check,
  Keyboard,
  Mail,
  MapPin,
  Mic,
  PencilLine,
  Phone,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import ForgeSymbol from "@/components/ForgeSymbol";

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

const manualFields = [
  "Nom / Prénom",
  "Nom de l’entreprise",
  "Téléphone",
  "Email",
  "Adresse",
  "Code postal",
  "Ville",
];

const clientFieldDuration = 720;
const clientFieldGap = 130;
const clientAnimationStart = 450;
const clientAnimationEnd =
  clientAnimationStart +
  clientDetails.length *
    (clientFieldDuration + clientFieldGap);
const clientAnimationDuration =
  clientAnimationEnd + 2600;

function getProgressiveText(
  text: string,
  progress: number,
) {
  const length = Math.floor(
    text.length * Math.min(1, Math.max(0, progress)),
  );

  return {
    visible: text.slice(0, length),
    remaining: text.slice(length),
  };
}

export default function ClientCreation() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasRevealed, setHasRevealed] =
    useState(false);
  const [animationElapsed, setAnimationElapsed] =
    useState(0);
  const [reduceMotion, setReduceMotion] =
    useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const frame = window.requestAnimationFrame(() => {
      setReduceMotion(mediaQuery.matches);
    });
    const updateMotionPreference = () =>
      setReduceMotion(mediaQuery.matches);

    mediaQuery.addEventListener(
      "change",
      updateMotionPreference,
    );

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasRevealed(true);
        }
      },
      {
        threshold: 0.08,
        rootMargin: "100px 0px",
      },
    );

    observer.observe(section);
    return () => {
      window.cancelAnimationFrame(frame);
      mediaQuery.removeEventListener(
        "change",
        updateMotionPreference,
      );
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || reduceMotion) return;

    const timer = window.setInterval(() => {
      setAnimationElapsed((current) => {
        const next = Math.min(
          current + 40,
          clientAnimationDuration,
        );

        if (next >= clientAnimationDuration) {
          window.clearInterval(timer);
        }

        return next;
      });
    }, 40);

    return () => window.clearInterval(timer);
  }, [isVisible, reduceMotion]);

  const effectiveElapsed = reduceMotion
    ? clientAnimationEnd
    : animationElapsed;
  const clientIsCreated =
    effectiveElapsed >= clientAnimationEnd;

  const revealClass = hasRevealed
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
          className={`landing-reveal-motion mx-auto max-w-3xl text-center duration-700 motion-reduce:transition-none ${revealClass}`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            05 · Gestion client instantanée
          </p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Créez vos fiches clients instantanément
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-pretty text-lg leading-8 text-slate-600 dark:text-slate-300">
            Créez vos fiches clients instantanément à la voix, à l’écrit ou manuellement selon votre besoin.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-pretty text-base leading-7 text-slate-500 dark:text-slate-400">
            Confiez les informations à Forge pour une création automatique, ou utilisez le formulaire classique lorsque vous préférez tout renseigner vous-même. Les deux méthodes fonctionnent pour les particuliers et les professionnels.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div
            className={`landing-reveal-motion delay-100 duration-1000 motion-reduce:transition-none ${
              hasRevealed
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
                  <p className="font-semibold">Création automatique par Forge</p>
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

              <div
                className={`mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-700 transition-opacity duration-500 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 ${
                  clientIsCreated
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              >
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
            className={`landing-reveal-motion relative delay-200 duration-1000 motion-reduce:transition-none ${
              hasRevealed
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
                <ForgeSymbol size={22} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {clientDetails.map(({ icon: Icon, label, value }, index) => {
                  const fieldStart =
                    clientAnimationStart +
                    index *
                      (clientFieldDuration + clientFieldGap);
                  const field = getProgressiveText(
                    value,
                    (effectiveElapsed - fieldStart) /
                      clientFieldDuration,
                  );

                  return (
                    <div
                      key={label}
                      className={`rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/75 ${
                        index === 0 ? "sm:col-span-2" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <Icon size={15} />
                        <p className="text-xs font-bold uppercase tracking-[0.12em]">
                          {label}
                        </p>
                      </div>
                      <p
                        aria-label={value}
                        className="mt-2 break-words text-sm font-semibold text-slate-800 dark:text-slate-100"
                      >
                        <span>{field.visible}</span>
                        <span aria-hidden="true" className="invisible">
                          {field.remaining}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`landing-reveal-motion mx-auto mt-12 grid max-w-5xl items-center gap-6 rounded-[2rem] border border-slate-200/90 bg-white/80 p-5 shadow-[0_24px_75px_-44px_rgba(15,23,42,0.4)] backdrop-blur-xl delay-300 duration-700 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900/75 sm:p-7 lg:grid-cols-[0.8fr_1.2fr] ${revealClass}`}
        >
          <div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <PencilLine size={21} />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
              Création manuelle
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight">
              Vous gardez toujours la main
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Remplissez directement un formulaire classique pour créer une fiche particulier ou professionnel avec uniquement les informations dont vous disposez.
            </p>
          </div>

          <div className="grid gap-3 min-[420px]:grid-cols-2">
            {manualFields.map((field, index) => (
              <div
                key={field}
                className={`rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/70 ${
                  index === manualFields.length - 1
                    ? "min-[420px]:col-span-2"
                    : ""
                }`}
              >
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {field}
                </p>
                <div className="mt-2 h-2 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div
              key={benefit}
              style={{ transitionDelay: `${350 + index * 80}ms` }}
              className={`landing-reveal-motion flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-4 text-sm font-semibold shadow-sm backdrop-blur duration-700 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900/70 ${revealClass}`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Check size={15} />
              </span>
              {benefit}
            </div>
          ))}
        </div>

        <div
          className={`landing-reveal-motion mx-auto mt-8 flex max-w-5xl items-start gap-3 rounded-2xl border border-slate-200/90 bg-white/75 px-4 py-3.5 text-left shadow-sm backdrop-blur delay-500 duration-700 motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900/70 ${revealClass}`}
        >
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <ForgeSymbol size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Forge comprend aussi les demandes simples.
            </p>
            <p className="mt-0.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Créez une fiche client avec seulement un nom et un numéro, ou ajoutez une entreprise avec ses informations principales.
            </p>
            <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-400">
              À l’écrit ou à la voix.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
