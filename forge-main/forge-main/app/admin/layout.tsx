import Link from "next/link";

import { requireStaff } from "@/src/lib/admin-auth";

const NAV = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/audit", label: "Journal", minRole: "ADMIN" as const },
  { href: "/admin/staff", label: "Staff", minRole: "SUPER_ADMIN" as const },
];

const ROLE_RANK = { SUPPORT: 1, ADMIN: 2, SUPER_ADMIN: 3 } as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, staff } = await requireStaff("SUPPORT");
  const rank = ROLE_RANK[staff.role];

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-sm font-bold tracking-tight text-blue-700 dark:text-blue-400">
            Forge · Admin
          </span>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {NAV.filter(
              (item) => !item.minRole || rank >= ROLE_RANK[item.minRole],
            ).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-medium text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {staff.role}
            </span>
            <span className="hidden sm:inline">{user.email}</span>
            <Link
              href="/app"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              ↩ Application
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
