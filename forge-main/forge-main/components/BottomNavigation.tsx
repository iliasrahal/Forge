"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, FileText, House, UsersRound, ReceiptText } from "lucide-react";

import {
  getBottomNavigationSection,
} from "@/src/lib/bottom-navigation";

const ITEMS = [
  { href: "/app", section: "home", label: "Accueil", icon: House },
  { href: "/clients", section: "clients", label: "Clients", icon: UsersRound },
  { href: "/quotes", section: "quotes", label: "Devis", icon: FileText },
  { href: "/invoices", section: "invoices", label: "Factures", icon: ReceiptText },
  { href: "/statistics", section: "statistics", label: "Stats", icon: BarChart3 },
] as const;

export default function BottomNavigation() {
  const pathname = usePathname();
  const activeSection = getBottomNavigationSection(pathname);
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  return (
    <nav className="grid grid-cols-5 gap-0.5">
      {ITEMS.map(({ href, section, label, icon: Icon }) => {
        const active = activeSection === section || pendingSection === section;

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            data-active={active ? "true" : undefined}
            onClick={() => {
              if (activeSection !== section) setPendingSection(section);
            }}
            className="forge-navlink group relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.72rem] font-semibold tracking-[-0.005em] transition-all duration-200 sm:min-h-16 sm:text-[0.78rem]"
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.6 : 2}
              className={
                active
                  ? ""
                  : "transition-transform group-hover:-translate-y-0.5"
              }
            />
            <span className="leading-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
