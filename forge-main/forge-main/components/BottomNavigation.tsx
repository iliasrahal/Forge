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
    <nav className="grid grid-cols-4 gap-1 text-center">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = activeFor(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.7rem] font-medium transition sm:min-h-16 sm:rounded-2xl sm:text-sm ${
              active
                ? "bg-blue-50 font-semibold text-blue-600 dark:bg-blue-500/12 dark:text-blue-300"
                : "text-slate-400 hover:bg-slate-100/70 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-slate-300"
            }`}
          >
            {active ? (
              <span className="absolute top-1 h-1 w-6 rounded-full bg-blue-600 dark:bg-blue-400" />
            ) : null}
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span className="leading-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
