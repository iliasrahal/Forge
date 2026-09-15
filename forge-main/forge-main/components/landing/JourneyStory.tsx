"use client";

import { useRef } from "react";
import { ArrowDown, Check, Sparkles } from "lucide-react";

import JourneyVisual from "@/components/landing/JourneyVisual";
import { useJourneyProgress } from "@/components/landing/useJourneyProgress";

const scenes = [
  { eyebrow: "01 · Une demande", title: "Dites-le. Forge l’organise.", body: "Créez une intervention manuellement, à l’écrit ou à la voix. Forge transforme les informations utiles en rendez-vous concret." },
  { eyebrow: "02 · Sur le terrain", title: "L’intervention vous suit.", body: "Client, heure, planning et statut restent au même endroit — pour une heure comme pour un chantier de plusieurs semaines." },
  { eyebrow: "03 · Le travail évolue", title: "Terminez ou prolongez.", body: "Le chantier continue ? Prolongez-le. Le travail est fait ? Terminez l’intervention et poursuivez naturellement." },
  { eyebrow: "04 · Votre choix", title: "Le compte rendu reste facultatif.", body: "Dictez, écrivez ou ajoutez des photos pour obtenir un compte rendu structuré — ou passez cette étape sans bloquer la suite." },
  { eyebrow: "05 · Au bon moment", title: "Le client, seulement lorsqu’il devient utile.", body: "Commencez sans remplir une fiche interminable. Forge permet ensuite de rattacher ou créer rapidement le client nécessaire à la facturation." },
  { eyebrow: "06 · Le chemin est clair", title: "La facture est la suite naturelle.", body: "Après l’intervention, créez directement la facture. Le devis reste une possibilité distincte lorsqu’il est nécessaire avant les travaux." },
  { eyebrow: "07 · Jusqu’au règlement", title: "Envoyée. Réglée. Suivie.", body: "La facture part par mail avec son lien de paiement par carte ou virement. Une fois le règlement reconnu, Forge actualise automatiquement son statut." },
  { eyebrow: "La branche optionnelle", title: "Un devis, quand le chantier l’exige.", body: "Préparez le devis, envoyez-le, faites-le signer en ligne puis créez l’intervention associée. Le parcours rejoint ensuite la facture et le paiement." },
] as const;

export default function JourneyStory() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const activeScene = useJourneyProgress(sectionRef, scenes.length);

  return (
    <section ref={sectionRef} className="landing-journey relative" aria-labelledby="journey-title">
      <div className="mx-auto max-w-7xl px-5 pt-16 text-center sm:px-8 sm:pt-20">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600 dark:text-blue-300">Le fil d’aube</p>
        <h2 id="journey-title" className="mx-auto mt-4 max-w-4xl text-balance text-4xl font-bold sm:text-5xl">Une intervention traverse Forge, jusqu’au paiement.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--forge-text-secondary)]">Sans rupture, sans ressaisie inutile, et toujours avec le dernier mot.</p>
        <ArrowDown className="mx-auto mt-7 text-blue-500" aria-hidden="true" />
      </div>

      <div className="journey-desktop-stage pointer-events-none sticky top-0 z-10 hidden h-svh overflow-hidden md:block" aria-hidden="true">
        <div className="journey-thread absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-blue-400 via-pink-400 to-blue-500" />
        <div className="absolute inset-0 mx-auto grid max-w-7xl grid-cols-[.9fr_1.1fr] items-center gap-16 px-10 lg:px-16">
          <div />
          <div key={activeScene} className="journey-stage-enter relative mx-auto w-full max-w-lg">
            <div className="absolute inset-8 -z-10 rounded-full bg-blue-500/20 blur-3xl" />
            <JourneyVisual scene={activeScene} />
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-[var(--forge-border)] bg-[var(--landing-panel)] px-4 py-2 text-xs font-bold backdrop-blur">{String(activeScene + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</div>
      </div>

      <div className="journey-copy relative z-20 mx-auto max-w-7xl px-5 md:-mt-[100svh] md:px-10 lg:px-16">
        {scenes.map((scene, index) => <article key={scene.title} className="journey-scene grid items-center py-12 md:min-h-[92svh] md:grid-cols-[.8fr_1.2fr] md:py-20">
          <div className="journey-copy-card max-w-xl rounded-[1.75rem] border border-[var(--forge-border)] bg-[var(--landing-panel)] p-6 shadow-[0_24px_70px_-48px_rgba(20,35,100,.7)] backdrop-blur-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600 dark:text-blue-300">{scene.eyebrow}</p>
            <h3 className="mt-4 text-3xl font-bold sm:text-4xl">{scene.title}</h3>
            <p className="mt-5 text-base leading-7 text-[var(--forge-text-secondary)] sm:text-lg">{scene.body}</p>
            {index === 5 ? <div className="mt-5 flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-300"><Sparkles size={17} /> Devis clairement optionnel</div> : null}
            {index === 6 ? <div className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300"><Check size={17} /> Statut PAYÉE synchronisé</div> : null}
          </div>
          <div className="mt-6 md:hidden"><JourneyVisual scene={index} /></div>
        </article>)}
      </div>
    </section>
  );
}
