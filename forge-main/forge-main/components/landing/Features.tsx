"use client";

import {
  CalendarDays,
  Camera,
  Check,
  ClipboardCheck,
  Euro,
  FileText,
  Keyboard,
  Mic,
  Send,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import ForgeBarPreview from "@/components/landing/ForgeBarPreview";
import ForgeSymbol from "@/components/ForgeSymbol";

const features = [
  {
    title: "Interventions",
    description:
      "Créer, modifier et suivre les interventions simplement.",
    eyebrow: "Du planning au terrain",
  },
  {
    title: "Comptes rendus",
    description:
      "L’intervention terminée, transmettez simplement ce que vous avez réalisé à la voix, à l’écrit ou avec des photos. Forge transforme vos informations en un compte rendu professionnel clair et structuré.",
    eyebrow: "Compte rendu automatique",
  },
  {
    title: "Devis",
    description:
      "Forge génère automatiquement des devis professionnels à partir d’une simple demande.",
    eyebrow: "Une proposition claire",
  },
  {
    title: "Factures",
    description:
      "Après chaque intervention, Forge génère automatiquement votre facture professionnelle.",
    eyebrow: "Jusqu’au règlement",
  },
  {
    title: "Assistant IA",
    description:
      "Parler ou écrire naturellement à Forge.",
    eyebrow: "Une interaction naturelle",
  },
];

const artisanNote =
  "« J’ai remplacé le robinet d’arrêt, changé le joint et vérifié l’étanchéité. »";

const reportItems = [
  {
    label: "Intervention réalisée",
    value:
      "Remplacement d’un robinet d’arrêt sous évier suite à une fuite constatée.",
  },
  {
    label: "Diagnostic",
    value:
      "Fuite détectée au niveau du raccord du robinet d’arrêt. Le joint était usé et provoquait une perte d’étanchéité.",
  },
  {
    label: "Travaux effectués",
    value:
      "Dépose de l’ancien robinet, installation du nouveau modèle, remplacement du joint et vérification de l’étanchéité de l’ensemble.",
  },
  {
    label: "Recommandation",
    value:
      "Contrôle conseillé lors des prochaines utilisations afin de vérifier le bon fonctionnement de l’installation.",
  },
];

const noteDuration = 2900;
const processingDuration = 900;
const reportItemDuration = 1550;
const reportItemGap = 180;
const reportStart = noteDuration + processingDuration;
const reportEnd =
  reportStart +
  reportItems.length *
    (reportItemDuration + reportItemGap);
const animationDuration = reportEnd + 3600;

function getTypedText(
  text: string,
  progress: number,
) {
  const characterCount = Math.floor(
    text.length * Math.min(1, Math.max(0, progress)),
  );

  return {
    visible: text.slice(0, characterCount),
    remaining: text.slice(characterCount),
    isComplete: characterCount >= text.length,
  };
}

function ReportIllustration() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] =
    useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updatePreference = () => {
      setReduceMotion(mediaQuery.matches);
    };
    const frame = window.requestAnimationFrame(
      updatePreference,
    );

    mediaQuery.addEventListener(
      "change",
      updatePreference,
    );

    return () => {
      window.cancelAnimationFrame(frame);
      mediaQuery.removeEventListener(
        "change",
        updatePreference,
      );
    };
  }, []);

  useEffect(() => {
    const card = cardRef.current;

    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 },
    );

    observer.observe(card);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || reduceMotion) return;

    const timer = window.setInterval(() => {
      setElapsed((current) =>
        (current + 40) % animationDuration,
      );
    }, 40);

    return () => window.clearInterval(timer);
  }, [isVisible, reduceMotion]);

  const effectiveElapsed = reduceMotion
    ? reportEnd
    : elapsed;
  const note = getTypedText(
    artisanNote,
    effectiveElapsed / noteDuration,
  );
  const isProcessing =
    effectiveElapsed >= noteDuration &&
    effectiveElapsed < reportStart;
  const isReady = effectiveElapsed >= reportEnd;

  return (
    <div
      ref={cardRef}
      className="relative mx-auto w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
          <ClipboardCheck size={20} />
        </span>
        <div>
          <p className="font-bold text-slate-950 dark:text-white">
            Ton compte rendu est prêt
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Généré automatiquement par Forge
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/35">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
          <Mic size={14} /> Note de l’artisan
        </div>
        <p
          aria-label={artisanNote}
          className="mt-2 text-sm italic leading-6 text-slate-700 dark:text-slate-200"
        >
          <span>{note.visible}</span>
          {!note.isComplete && !reduceMotion && (
            <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-blue-600 motion-reduce:hidden" />
          )}
          <span aria-hidden="true" className="invisible">
            {note.remaining}
          </span>
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Mic size={13} /> Dictée
          <span aria-hidden="true">·</span>
          <Keyboard size={13} /> Texte
          <span aria-hidden="true">·</span>
          <Camera size={13} /> Photos
        </p>
      </div>

      <div
        aria-live="polite"
        className="mt-3 flex h-5 items-center text-xs font-semibold text-blue-600 dark:text-blue-400"
      >
        <span
          className={`transition-opacity duration-300 ${
            isProcessing || isReady
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          {isReady
            ? "Compte rendu prêt"
            : "Forge prépare le compte rendu…"}
        </span>
      </div>

      <div className="mt-2 space-y-4">
        {reportItems.map((item, itemIndex) => {
          const itemStart =
            reportStart +
            itemIndex *
              (reportItemDuration + reportItemGap);
          const progress =
            (effectiveElapsed - itemStart) /
            reportItemDuration;
          const typedItem = getTypedText(
            item.value,
            progress,
          );
          const hasStarted = progress > 0;

          return (
            <div key={item.label}>
              <p
                className={`text-sm font-bold text-blue-700 transition-opacity duration-300 dark:text-blue-400 ${
                  hasStarted || reduceMotion
                    ? "opacity-100"
                    : "opacity-35"
                }`}
              >
                {item.label}
              </p>
              <p
                aria-label={item.value}
                className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300"
              >
                <span>{typedItem.visible}</span>
                <span aria-hidden="true" className="invisible">
                  {typedItem.remaining}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
        >
          Modifier
        </button>
        <button
          type="button"
          className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          Valider
        </button>
      </div>
    </div>
  );
}

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
    return <ReportIllustration />;
  }

  if (index === 2) {
    return (
      <div className="relative mx-auto max-w-sm rotate-[-2deg] rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 transition duration-700 hover:rotate-0 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white"><FileText size={20} /></span>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-blue-700 dark:bg-blue-950 dark:text-blue-300">DEVIS PRÊT</span>
        </div>
        <div className="mt-8 h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="mt-2 h-2 w-4/5 rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-5 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400">Total TTC</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1 240 €</span>
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Send size={16} />
          Envoyé au client
        </div>
      </div>
    );
  }

  if (index === 3) {
    return (
      <div className="relative mx-auto flex max-w-md items-center justify-center py-10">
        <div className="relative z-10 rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white"><Euro size={25} /></span>
          <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">Facture prête</p>
          <p className="mt-1 text-3xl font-bold">840 €</p>
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Send size={16} />
            Envoyée au client
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-md py-8">
      <div className="absolute inset-10 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 dark:bg-white"><ForgeSymbol size={26} /></span>
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

type FeaturesProps = {
  group?: "all" | "operations" | "documents";
  showHeading?: boolean;
};

const featureNumbers = [1, 2, 4, 3, 0];

export default function Features({
  group = "all",
  showHeading = true,
}: FeaturesProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visibleItems, setVisibleItems] =
    useState<number[]>([]);

  const featureEntries = features
    .map((feature, index) => ({ feature, index }))
    .filter(({ index }) => {
      if (group === "operations") return index < 2;
      if (group === "documents") return index >= 2 && index < 4;
      return true;
    })
    .sort((first, second) => {
      if (group !== "documents") return first.index - second.index;
      return second.index - first.index;
    });

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      const frame = window.requestAnimationFrame(() => {
        setVisibleItems(
          Array.from(
            section.querySelectorAll<HTMLElement>(
              "[data-feature-item]",
            ),
          ).map((item) => Number(item.dataset.index)),
        );
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
      {showHeading && (
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Tout votre quotidien</p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Une seule expérience, du premier appel au paiement.</h2>
        </div>
      )}

      <div className={`mx-auto max-w-7xl ${showHeading ? "mt-20" : ""}`}>
        {featureEntries.map(({ feature, index }) => {
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
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                  {featureNumbers[index] > 0 && `0${featureNumbers[index]} · `}
                  {feature.eyebrow}
                </p>
                <h3 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{feature.title}</h3>
                <p className="mt-6 max-w-xl text-xl leading-8 text-slate-600 dark:text-slate-300">{feature.description}</p>
                {index === 1 && (
                  <div className="mt-8 max-w-xl">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          title: "Mode voix",
                          text: "Dictez simplement ce qui a été réalisé.",
                          icon: Mic,
                        },
                        {
                          title: "Mode texte",
                          text: "Écrivez rapidement vos notes d’intervention.",
                          icon: Keyboard,
                        },
                        {
                          title: "Mode photo",
                          text: "Prenez directement une ou plusieurs photos sur place, ou choisissez-les dans votre galerie, puis ajoutez votre explication.",
                          icon: Camera,
                        },
                      ].map(({ title, text, icon: Icon }) => (
                        <div
                          key={title}
                          className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                        >
                          <Icon size={19} className="text-blue-600 dark:text-blue-400" />
                          <p className="mt-3 text-sm font-bold text-slate-950 dark:text-white">
                            {title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {text}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3">
                      {[
                        "Vérifiez les photos avant l’envoi et retirez facilement celle sélectionnée par erreur",
                        "Vos photos complètent votre explication et Forge utilise l’ensemble pour préparer le même compte rendu structuré",
                      ].map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          <Check size={15} />
                        </span>
                        {benefit}
                      </div>
                      ))}
                    </div>
                  </div>
                )}
                {index === 2 && (
                  <div className="mt-8 grid max-w-xl gap-3">
                    {[
                      "Génération automatique depuis une demande simple",
                      "Prestations structurées de manière professionnelle",
                      "Envoi facile et rapide au client",
                      "Depuis un devis accepté, créez automatiquement l’intervention associée",
                    ].map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          <Check size={15} />
                        </span>
                        {benefit}
                      </div>
                    ))}
                  </div>
                )}
                {index === 3 && (
                  <>
                    <p className="mt-3 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                      Vous pouvez ensuite l’envoyer directement par mail à votre client en quelques secondes.
                    </p>
                    <div className="mt-8 grid max-w-xl gap-3">
                      {[
                        "Facture générée automatiquement après l’intervention",
                        "Création professionnelle à partir du compte rendu",
                        "Envoi rapide par mail au client",
                      ].map((benefit) => (
                        <div
                          key={benefit}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            <Check size={15} />
                          </span>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {index === 4 && (
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
