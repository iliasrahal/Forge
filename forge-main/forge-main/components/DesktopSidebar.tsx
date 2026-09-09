"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  House,
  ReceiptText,
  Settings,
  UsersRound,
} from "lucide-react";

import ForgeLogo from "@/components/ForgeLogo";
import { getBottomNavigationSection } from "@/src/lib/bottom-navigation";

const ITEMS = [
  { href: "/app", section: "home", label: "Accueil", icon: House },
  { href: "/clients", section: "clients", label: "Clients", icon: UsersRound },
  { href: "/quotes", section: "quotes", label: "Devis", icon: FileText },
  {
    href: "/invoices",
    section: "invoices",
    label: "Factures",
    icon: ReceiptText,
  },
] as const;

export default function DesktopSidebar() {
  const pathname = usePathname();
  const activeSection = getBottomNavigationSection(pathname);
  const settingsActive = pathname.startsWith("/settings");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-6 lg:flex">
      <Link href="/app" className="flex items-center gap-2.5 px-2">
        <ForgeLogo size={34} />
        <span className="text-lg font-semibold tracking-tight text-[var(--forge-text-primary)]">
          Forge
        </span>
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {ITEMS.map(({ href, section, label, icon: Icon }) => {
          const active = activeSection === section;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[color-mix(in_srgb,var(--forge-accent-blue)_20%,var(--forge-surface))] text-[var(--forge-text-primary)]"
                  : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-surface-hover)] hover:text-[var(--forge-text-primary)]"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        aria-current={settingsActive ? "page" : undefined}
        className={`mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
          settingsActive
            ? "bg-[color-mix(in_srgb,var(--forge-accent-blue)_20%,var(--forge-surface))] text-[var(--forge-text-primary)]"
            : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-surface-hover)] hover:text-[var(--forge-text-primary)]"
        }`}
      >
        <Settings size={18} strokeWidth={settingsActive ? 2.5 : 2} />
        Réglages
      </Link>
    </aside>
  );
}
