import {
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  FileCheck2,
  FileText,
  Mail,
  Mic,
  ReceiptText,
  UserRoundPlus,
  WalletCards,
  Wrench,
} from "lucide-react";

import ForgeSymbol from "@/components/ForgeSymbol";

const shell =
  "journey-product-card relative overflow-hidden rounded-[1.75rem] border border-[var(--forge-card-border)] bg-[var(--landing-panel)] p-5 shadow-[0_28px_80px_-42px_rgba(20,35,100,.65)] backdrop-blur-xl sm:p-6";

function Status({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "violet" }) {
  const colors = tone === "green"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
    : tone === "violet"
      ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
      : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  return <span className={`rounded-full px-3 py-1 text-[.68rem] font-bold uppercase tracking-[.12em] ${colors}`}>{children}</span>;
}

export default function JourneyVisual({ scene }: { scene: number }) {
  if (scene === 0) {
    return <div className={shell}>
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><ForgeSymbol size={24} /></span><div><p className="font-bold">Assistant Forge</p><p className="text-xs text-[var(--forge-text-muted)]">Écrit, voix ou saisie manuelle</p></div></div>
      <div className="mt-5 rounded-2xl border border-[var(--forge-border)] bg-[var(--landing-panel-soft)] p-4 text-sm font-semibold leading-6"><span className="text-blue-600 dark:text-blue-300">«</span> J’ai une intervention demain à 10 h chez Charles. <span className="text-blue-600 dark:text-blue-300">»</span></div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold"><span className="rounded-xl border border-[var(--forge-border)] px-2 py-2">Manuel</span><span className="rounded-xl border border-blue-300 px-2 py-2 text-blue-700 dark:text-blue-300">Texte</span><span className="rounded-xl border border-[var(--forge-border)] px-2 py-2"><Mic className="mx-auto" size={15} /></span></div>
      <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600"><Check size={16} /> Demande comprise</p>
    </div>;
  }

  if (scene === 1) {
    return <div className={shell}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-600 dark:text-blue-300">Aujourd’hui · 10:00</p><h3 className="mt-2 text-xl font-bold">Remplacement du robinet</h3><p className="mt-1 text-sm text-[var(--forge-text-secondary)]">Charles Xavier</p></div><Status>En cours</Status></div>
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[var(--forge-border)] pt-4 text-center text-xs"><div><CalendarDays className="mx-auto text-blue-600" size={17} /><p className="mt-1 font-semibold">Planning</p></div><div><Wrench className="mx-auto text-blue-600" size={17} /><p className="mt-1 font-semibold">Intervention</p></div><div><FileText className="mx-auto text-blue-600" size={17} /><p className="mt-1 font-semibold">Suivi</p></div></div>
      <div className="mt-4 rounded-xl bg-violet-100/70 px-3 py-2 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-200">Aussi adapté aux chantiers multi-jours</div>
    </div>;
  }

  if (scene === 2) {
    return <div className={shell}>
      <div className="flex items-center justify-between"><div><p className="text-xs text-[var(--forge-text-muted)]">Intervention en cours</p><h3 className="mt-1 text-xl font-bold">Travail terminé ?</h3></div><Wrench className="text-blue-600" /></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-4 py-3 text-center text-sm font-bold text-white">Terminer</div><div className="rounded-2xl border border-[var(--forge-border-strong)] px-4 py-3 text-center text-sm font-bold">Prolonger</div></div>
      <p className="mt-4 text-center text-xs text-[var(--forge-text-muted)]">Forge suit une intervention ponctuelle comme un chantier qui continue.</p>
    </div>;
  }

  if (scene === 3) {
    return <div className={shell}>
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-600 dark:text-blue-300">Compte rendu</p><h3 className="mt-1 text-xl font-bold">À vous de choisir</h3></div><div className="flex gap-2"><Mic size={17} /><Camera size={17} /></div></div>
      <div className="mt-5 rounded-2xl border border-blue-300 bg-blue-50/60 p-4 dark:bg-blue-950/30"><p className="font-bold">Faire le compte rendu</p><p className="mt-1 text-xs leading-5 text-[var(--forge-text-secondary)]">Texte, voix ou photos deviennent un document structuré.</p></div>
      <div className="my-2 text-center text-xs font-bold text-[var(--forge-text-muted)]">OU</div>
      <div className="rounded-2xl border border-[var(--forge-border)] p-4"><p className="font-bold">Passer le compte rendu</p><p className="mt-1 text-xs text-[var(--forge-text-secondary)]">La facturation reste accessible.</p></div>
    </div>;
  }

  if (scene === 4) {
    return <div className={shell}>
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><UserRoundPlus size={21} /></span><div><p className="text-xs text-[var(--forge-text-muted)]">Seulement si nécessaire</p><h3 className="font-bold">Associer le client</h3></div></div>
      <div className="mt-5 space-y-2"><div className="rounded-xl border border-[var(--forge-border)] px-4 py-3 text-sm"><span className="text-[var(--forge-text-muted)]">Client existant</span><strong className="float-right">Charles Xavier</strong></div><div className="rounded-xl border border-[var(--forge-border)] px-4 py-3 text-sm font-semibold">+ Créer rapidement sa fiche</div></div>
      <p className="mt-4 text-xs leading-5 text-[var(--forge-text-muted)]">L’intervention peut commencer sans imposer une longue fiche au préalable.</p>
    </div>;
  }

  if (scene === 5) {
    return <div className={shell}>
      <p className="text-center text-xs font-bold uppercase tracking-[.16em] text-blue-600 dark:text-blue-300">Deux parcours, une même arrivée</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1.15fr_.85fr]"><div className="rounded-2xl border-2 border-blue-500 bg-blue-50/60 p-4 dark:bg-blue-950/30"><Status>Chemin principal</Status><ReceiptText className="mt-5 text-blue-600" /><p className="mt-2 font-bold">Créer la facture</p><p className="mt-1 text-xs">Directement après l’intervention</p></div><div className="rounded-2xl border border-dashed border-violet-400 p-4"><Status tone="violet">Optionnel</Status><FileCheck2 className="mt-5 text-violet-600" /><p className="mt-2 font-bold">Besoin d’un devis ?</p><p className="mt-1 text-xs">Avant le travail, si nécessaire</p></div></div>
    </div>;
  }

  if (scene === 6) {
    return <div className={shell}>
      <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--forge-text-muted)]">Facture F2026-000042</p><h3 className="mt-2 text-2xl font-bold">840,00 €</h3></div><Status tone="green">Payée</Status></div>
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[var(--forge-border)] p-4"><span className="flex items-center gap-2 text-sm font-semibold"><Mail size={17} /> Envoyée au client</span><ChevronRight size={17} /></div>
      <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 dark:bg-emerald-950/35"><p className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300"><WalletCards size={18} /> Paiement reconnu</p><div className="mt-3 flex justify-between text-sm"><span>Encaissé</span><strong>840,00 €</strong></div><div className="mt-1 flex justify-between text-sm"><span>Reste dû</span><strong>0,00 €</strong></div></div>
    </div>;
  }

  return <div className={shell}>
    <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-violet-600 dark:text-violet-300">Devis D2026-000018</p><h3 className="mt-2 text-xl font-bold">Rénovation salle de bain</h3></div><Status tone="green">Accepté</Status></div>
    <div className="mt-5 space-y-2"><div className="flex justify-between border-b border-[var(--forge-border)] pb-2 text-sm"><span>Préparation</span><strong>420 €</strong></div><div className="flex justify-between border-b border-[var(--forge-border)] pb-2 text-sm"><span>Installation</span><strong>820 €</strong></div></div>
    <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-100/70 px-3 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><Check size={17} /> Consulté et signé en ligne</div>
    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--forge-text-secondary)]"><FileCheck2 size={15} /> Le devis accepté peut devenir une intervention.</div>
  </div>;
}
