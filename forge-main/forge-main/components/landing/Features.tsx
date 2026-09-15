"use client";

import {
  CalendarDays,
  Camera,
  Check,
  ClipboardCheck,
  Euro,
  FileText,
  Images,
  Keyboard,
  PackageSearch,
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
    title: "Une intervention d’une heure ou un chantier de plusieurs semaines.",
    description:
      "Forge s’adapte à votre planning. Créez une intervention ponctuelle ou planifiez un chantier sur plusieurs jours, puis détaillez ce qui est prévu chaque journée.",
    eyebrow: "Interventions et chantiers multi-jours",
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
      "Partez d’une photo prise sur le chantier ou choisie dans votre galerie. Forge relève les informations visibles et préremplit votre devis ; si vous le souhaitez, vous pouvez aussi parcourir des références de votre catalogue métier.",
    eyebrow: "Une proposition claire",
  },
  {
    title: "Factures",
    description:
      "Après chaque intervention, Forge prépare votre facture professionnelle. Depuis un devis, créez aussi vos acomptes et gardez le montant restant sous les yeux.",
    eyebrow: "Jusqu’au règlement",
  },
  {
    title: "Assistant Forge",
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
      setElapsed((current) => {
        const next = Math.min(
          current + 40,
          animationDuration,
        );

        if (next >= animationDuration) {
          window.clearInterval(timer);
        }

        return next;
      });
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
          <div className="mr-6 flex items-center gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur transition duration-500 dark:border-slate-700 dark:bg-slate-900/90">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <CalendarDays size={20} />
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Intervention simple</p>
              <p className="mt-1 font-semibold">Demain à 10 h</p>
            </div>
            <Check size={18} className="text-emerald-500" />
          </div>

          <div className="ml-3 rounded-3xl border border-violet-200 bg-violet-50/90 p-4 shadow-lg shadow-violet-600/10 backdrop-blur dark:border-violet-800 dark:bg-violet-950/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">Chantier multi-jours</p>
                <p className="mt-1 font-bold text-violet-950 dark:text-violet-100">Rénovation salle de bain</p>
              </div>
              <span className="shrink-0 rounded-full bg-white/75 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-900/70 dark:text-violet-200">15 → 18 mai</span>
            </div>

            <div className="mt-4 space-y-2">
              {[
                ["15 mai", "Mur"],
                ["16 mai", "Câbles"],
                ["17 mai", "Peinture"],
                ["18 mai", "Finitions"],
              ].map(([date, task]) => (
                <div key={date} className="flex items-center gap-3 rounded-xl border border-violet-200/70 bg-white/65 px-3 py-2 text-sm dark:border-violet-800/70 dark:bg-slate-900/45">
                  <span className="w-14 shrink-0 text-xs font-bold text-violet-600 dark:text-violet-300">{date}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return <ReportIllustration />;
  }

  if (index === 2) {
    return <MaterialToQuoteIllustration />;
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

function MaterialToQuoteIllustration() {
  return (
    <div className="landing-material-stage relative mx-auto w-full max-w-xl py-5 [perspective:1100px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/15" />
      <div className="relative grid gap-3 sm:grid-cols-[0.86fr_1.14fr] sm:items-center">
        <div className="relative z-20 space-y-3 sm:translate-x-3 sm:[transform:rotateY(7deg)_rotateZ(-1.5deg)]">
          <div className="rounded-[1.5rem] border border-blue-200/80 bg-white/90 p-3 shadow-xl backdrop-blur dark:border-blue-800 dark:bg-slate-900/90">
            <div className="relative h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-500 to-blue-900">
              <div className="absolute inset-x-8 bottom-4 top-4 rounded-lg border-2 border-white/60 bg-white/10">
                <div className="grid h-full grid-cols-6 gap-1 p-2">{Array.from({ length: 6 }).map((_, index) => <span key={index} className="rounded-sm bg-white/55" />)}</div>
              </div>
              <span className="absolute left-3 top-3 rounded-full bg-slate-950/60 px-2 py-1 text-[10px] font-bold text-white">Vue générale</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm font-bold"><Camera size={15} className="text-blue-600 dark:text-blue-400" /> Analyse du matériel</div>
            <div className="mt-2 rounded-xl bg-blue-50/80 p-3 dark:bg-blue-950/45">
              <p className="text-sm font-bold">Radiateur · Atlantic</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Vertical · 1 500 W</p>
            </div>
          </div>
          <div className="landing-material-plate ml-8 flex items-center gap-3 rounded-2xl border border-pink-200 bg-white/95 p-3 shadow-lg dark:border-pink-900 dark:bg-slate-900/95">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300"><Images size={18} /></span>
            <div><p className="text-xs font-bold text-slate-900 dark:text-white">Une précision est nécessaire</p><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Ajoutez la photo de la plaque.</p></div>
          </div>
          <div className="flex gap-2">
            <span className="flex min-h-10 flex-1 items-center justify-center rounded-xl bg-blue-600 px-2 text-center text-[10px] font-bold leading-tight text-white">Créer un devis à partir de l’analyse</span>
            <span className="flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-2 text-center text-[10px] font-bold leading-tight dark:border-slate-700 dark:bg-slate-900/90">Propositions de matériel</span>
          </div>
          <p className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">Photo directe ou ajout depuis la galerie</p>
        </div>

        <div className="relative z-10 space-y-3 sm:-translate-x-2 sm:[transform:rotateY(-5deg)]">
          <div className="landing-material-proposals rounded-[1.5rem] border border-blue-200 bg-blue-50/90 p-3 shadow-xl backdrop-blur dark:border-blue-900 dark:bg-blue-950/70">
            <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">Propositions de matériel</p><span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Facultatif</span></div>
            <div className="mt-2 space-y-1.5">
              <div className="rounded-xl border border-blue-300 bg-white/90 px-3 py-2 dark:border-blue-700 dark:bg-slate-900/90"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-bold">Radiateur vertical</p><p className="text-[10px] text-slate-500 dark:text-slate-400">Atlantic · 1 500 W</p></div><span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Choisir</span></div></div>
              <div className="rounded-xl bg-white/60 px-3 py-2 dark:bg-slate-900/55"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-bold">Radiateur panneau</p><p className="text-[10px] text-slate-500 dark:text-slate-400">Référence du catalogue</p></div><span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Choisir</span></div></div>
            </div>
            <p className="mt-2 text-[9px] leading-4 text-slate-500 dark:text-slate-400">L’artisan vérifie toujours la référence avant de la sélectionner.</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><FileText size={18} /></span><span className="text-[10px] font-bold tracking-[0.16em] text-blue-600 dark:text-blue-400">DEVIS D2026-0142</span></div>
          <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/75 p-3 dark:border-blue-900 dark:bg-blue-950/45">
            <div className="flex items-start gap-3"><PackageSearch size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" /><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">Devis prérempli</p><p className="mt-1 text-sm font-bold">Radiateur Atlantic</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Référence et prix ajoutés seulement s’ils sont connus</p></div><Check size={17} className="ml-auto shrink-0 text-emerald-500" /></div>
          </div>
          <div className="landing-material-line mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/40"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">Informations transférées</p><p className="mt-1 font-semibold">Matériel · Marque · Caractéristiques</p></div>
          <div className="mt-3 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">Vous vérifiez et complétez avant de créer</div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">Analyse directe ou catalogue matériel : l’artisan garde toujours le choix.</p>
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
      className={`overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white ${showHeading ? "landing-section-spacing" : ""}`}
    >
      {showHeading && (
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Tout votre quotidien</p>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Une seule expérience, du premier appel au paiement.</h2>
        </div>
      )}

      <div className={`mx-auto max-w-7xl ${showHeading ? "mt-12 sm:mt-14" : ""}`}>
        {featureEntries.map(({ feature, index }) => {
          const isVisible = visibleItems.includes(index);
          const isReversed = index % 2 === 1;

          return (
            <article
              key={feature.title}
              data-feature-item
              data-index={index}
              className="relative grid items-center gap-12 border-t border-slate-200 px-6 py-14 last:border-b dark:border-slate-800 sm:py-16 lg:grid-cols-2 lg:px-12"
            >
              <div className={`landing-reveal-motion duration-1000 motion-reduce:transition-none ${isReversed ? "lg:order-2" : ""} ${isVisible ? "translate-x-0 opacity-100" : isReversed ? "translate-x-10 opacity-0" : "-translate-x-10 opacity-0"}`}>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                  {featureNumbers[index] > 0 && `0${featureNumbers[index]} · `}
                  {feature.eyebrow}
                </p>
                <h3 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{feature.title}</h3>
                <p className="mt-6 max-w-xl text-xl leading-8 text-slate-600 dark:text-slate-300">{feature.description}</p>
                {index === 0 && (
                  <div className="mt-8 max-w-xl rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm leading-6 text-violet-800 shadow-sm dark:border-violet-900 dark:bg-violet-950/45 dark:text-violet-200">
                    <p className="font-semibold">« J’ai un chantier du 15 au 30 mai, le 15 je fais le mur, le 16 les câbles et le 17 la peinture. »</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-violet-600 dark:text-violet-300">À l’écrit comme à l’oral</p>
                    <p className="mt-1 text-sm">Créez d’abord votre chantier, puis ajoutez les tâches de chaque journée au fur et à mesure.</p>
                  </div>
                )}
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
                      "Sur le chantier ou depuis votre galerie, vos photos peuvent servir à préparer le devis",
                      "Une information manque ? Forge vous demande simplement de la préciser",
                      "Créez directement un devis prérempli avec les informations réellement identifiées",
                      "Consultez facultativement des références adaptées à votre métier dans le catalogue matériel",
                      "Vous vérifiez et choisissez toujours la référence avant son ajout au devis",
                      "Votre client reçoit un lien sécurisé pour consulter, accepter et signer son devis en ligne",
                      "Le statut du devis est mis à jour dès son acceptation",
                      "Forge repère les devis sans réponse et propose une relance que vous vérifiez avant l’envoi",
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
                        "Factures d’acompte créées directement depuis le devis",
                        "Montant déjà demandé et restant du devis toujours visibles",
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

              <div className={`landing-reveal-motion delay-150 duration-1000 motion-reduce:transition-none ${isReversed ? "lg:order-1" : ""} ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
                <FeatureIllustration index={index} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
