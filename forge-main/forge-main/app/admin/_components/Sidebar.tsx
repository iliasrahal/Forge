"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  ScrollText,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

import { Avatar } from "./ui";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true, minRank: 1 },
  { href: "/admin/users", label: "Utilisateurs", icon: Users, minRank: 1 },
  { href: "/admin/teams", label: "Équipes", icon: Building2, minRank: 1 },
  { href: "/admin/audit", label: "Journal d'audit", icon: ScrollText, minRank: 2 },
  { href: "/admin/staff", label: "Staff", icon: ShieldCheck, minRank: 3 },
];

export default function Sidebar({
  role,
  email,
  name,
  rank,
}: {
  role: string;
  email: string;
  name: string;
  rank: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white/80 px-4 py-5 backdrop-blur-xl lg:flex dark:border-slate-800/80 dark:bg-slate-900/60">
      <Link href="/admin" className="mb-7 flex items-center gap-2.5 px-1">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
          F
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          Forge
          <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Admin
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.filter((item) => rank >= item.minRank).map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              className={`admin-nav-link flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                active
                  ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar name={name} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{name}</p>
            <p className="truncate text-[11px] text-slate-400">{email}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {role}
          </span>
          <Link
            href="/app"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Application
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function MobileTopbar({ rank }: { rank: number }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-slate-200/80 bg-white/85 px-3 py-2 backdrop-blur-xl lg:hidden dark:border-slate-800/80 dark:bg-slate-900/70">
      <span className="mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">
        F
      </span>
      {NAV.filter((item) => rank >= item.minRank).map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
              active
                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/app"
        className="ml-auto shrink-0 px-2 text-[13px] font-medium text-blue-600 dark:text-blue-400"
      >
        ↩
      </Link>
    </div>
  );
}
