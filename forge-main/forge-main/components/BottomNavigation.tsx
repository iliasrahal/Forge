"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, House, UsersRound, ReceiptText } from "lucide-react";

const ITEMS = [
  { href: "/app", label: "Accueil", icon: House },
  { href: "/clients", label: "Clients", icon: UsersRound },
  { href: "/quotes", label: "Devis", icon: FileText },
  { href: "/invoices", label: "Factures", icon: ReceiptText },
] as const;

export default function BottomNavigation() {
  const pathname = usePathname();

  const isQuotes = pathname.startsWith("/quotes");
  const isInvoices = pathname.startsWith("/invoices");
  const isClients =
    !isQuotes &&
    !isInvoices &&
    (pathname.startsWith("/clients") ||
      pathname.startsWith("/intervention") ||
      pathname.startsWith("/history"));

  const activeFor = (href: string) => {
    if (href === "/app") return pathname === "/app";
    if (href === "/quotes") return isQuotes;
    if (href === "/invoices") return isInvoices;
    if (href === "/clients") return isClients;

    return false;
  };

  return (
    <nav className="grid grid-cols-4 gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = activeFor(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            data-active={active ? "true" : undefined}
            className="forge-navlink group relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-all duration-200 sm:min-h-16 sm:text-[0.74rem]"
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
