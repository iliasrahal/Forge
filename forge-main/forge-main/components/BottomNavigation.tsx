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
            className={`group relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.7rem] font-semibold transition-all duration-200 sm:min-h-16 sm:text-[0.78rem] ${
              active
                ? "bg-blue-600 text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)]"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800/70 dark:hover:text-slate-200"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 2}
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
