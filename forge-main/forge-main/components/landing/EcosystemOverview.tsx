import {
  BellRing,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  ReceiptText,
  TrendingUp,
  UsersRound,
  WalletCards,
  Wrench,
} from "lucide-react";

import ForgeLogo from "@/components/ForgeLogo";

const capabilities = [
  [CalendarDays, "Planning"],
  [Wrench, "Interventions"],
  [ClipboardCheck, "Comptes rendus"],
  [UsersRound, "Clients"],
  [FileCheck2, "Devis"],
  [ReceiptText, "Factures"],
  [WalletCards, "Paiements"],
  [TrendingUp, "Rentabilité"],
  [BellRing, "Rappels"],
] as const;

export default function EcosystemOverview() {
  return (
    <section className="landing-section-spacing relative overflow-hidden px-5 sm:px-8" aria-labelledby="ecosystem-title">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />
      <div className="relative mx-auto max-w-6xl text-center">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600 dark:text-blue-300">Toute l’activité centralisée</p>
        <h2 id="ecosystem-title" className="mx-auto mt-4 max-w-4xl text-balance text-4xl font-bold sm:text-5xl">Ce n’était pas plusieurs outils. C’était Forge.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--forge-text-secondary)]">Le planning, le terrain, les clients, les documents et les paiements restent reliés dans un même espace.</p>

        <div className="ecosystem-orbit relative mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))]">
          {capabilities.map(([Icon, label], index) => (
            <div key={label} className={`ecosystem-capability rounded-2xl border border-[var(--forge-border)] bg-[var(--landing-panel)] px-3 py-4 shadow-sm backdrop-blur ${index === 4 ? "lg:col-start-1" : ""}`}>
              <Icon className="mx-auto text-blue-600 dark:text-blue-300" size={20} />
              <p className="mt-2 text-xs font-bold sm:text-sm">{label}</p>
            </div>
          ))}
          <div className="col-span-2 row-start-1 mx-auto grid h-24 w-24 place-items-center rounded-[2rem] border border-blue-400/50 bg-[var(--landing-panel)] shadow-[0_20px_70px_-25px_rgba(37,99,235,.75)] backdrop-blur sm:col-span-1 sm:col-start-2 lg:col-start-3 lg:row-start-1">
            <ForgeLogo size={72} />
          </div>
        </div>
      </div>
    </section>
  );
}
