import Link from "next/link";
import {
  Bell,
  BellRing,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Mail,
  Palette,
  Receipt,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import SmartRemindersSetting from "@/components/SmartRemindersSetting";
import { requireCurrentUser } from "@/src/lib/auth";

type Row = {
  href: string;
  label: string;
  hint: string;
  icon: typeof FileText;
};

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "Documents",
    rows: [
      {
        href: "/settings/services",
        label: "Prestations et tarifs",
        hint: "Ton catalogue réutilisable dans les devis",
        icon: FileText,
      },
      {
        href: "/settings/facturation",
        label: "TVA et facturation",
        hint: "Régime de TVA, taux par défaut, numérotation",
        icon: Receipt,
      },
      {
        href: "/settings/quote-templates",
        label: "Modèles de devis",
        hint: "Devis types réutilisables en un clic",
        icon: LayoutTemplate,
      },
      {
        href: "/settings/branding",
        label: "Logo et identité",
        hint: "Ton logo en tête des documents envoyés",
        icon: ImageIcon,
      },
      {
        href: "/settings/reminders",
        label: "Relances automatiques",
        hint: "Fréquence des relances devis et factures",
        icon: BellRing,
      },
    ],
  },
  {
    title: "Paiements",
    rows: [
      {
        href: "/settings/paiement",
        label: "Paiement en ligne",
        hint: "Encaisser par carte et virement via Stripe",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Compte",
    rows: [
      {
        href: "/settings/account",
        label: "Compte",
        hint: "Coordonnées et informations d’entreprise",
        icon: UserRound,
      },
      {
        href: "/settings/email-signature",
        label: "Signature e-mail",
        hint: "Bas de page de tes envois",
        icon: Mail,
      },
      {
        href: "/settings/appearance",
        label: "Apparence",
        hint: "Thème clair ou sombre",
        icon: Palette,
      },
      {
        href: "/settings/security",
        label: "Sécurité",
        hint: "Mot de passe et sessions",
        icon: ShieldCheck,
      },
    ],
  },
];

export default async function SettingsPage() {
  const currentUser = await requireCurrentUser();

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-6 py-8">
      <Link
        href="/app"
        className="forge-back-link text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-400"
      >
        Retour
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-blue-700 dark:text-blue-400">
        Réglages
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Personnalise ton expérience Forge.
      </p>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--forge-accent-blue)_16%,transparent)] text-[var(--forge-accent-blue-lit)]">
          <Bell size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <SmartRemindersSetting
            initialEnabled={currentUser.smartRemindersEnabled}
          />
        </div>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title} className="mt-8">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--forge-text-muted)]">
            {group.title}
          </h2>
          <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface)]">
            {group.rows.map((row, index) => {
              const Icon = row.icon;
              return (
                <Link
                  key={row.href}
                  href={row.href}
                  className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-[var(--forge-surface-hover)] ${
                    index > 0
                      ? "border-t border-[var(--forge-border)]"
                      : ""
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--forge-accent-blue)_12%,transparent)] text-[var(--forge-accent-blue-lit)]">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--forge-text-primary)]">
                      {row.label}
                    </span>
                    <span className="block truncate text-sm text-[var(--forge-text-muted)]">
                      {row.hint}
                    </span>
                  </span>
                  <span className="text-[var(--forge-text-muted)]">›</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
