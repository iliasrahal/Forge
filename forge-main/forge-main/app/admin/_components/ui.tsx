import Link from "next/link";
import type { ComponentType } from "react";

/* ---------------- Card ---------------- */

export function Card({
  children,
  className = "",
  hover = false,
  as = "div",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "section" | "a";
  href?: string;
}) {
  const cls = `admin-card ${hover ? "admin-card-hover" : ""} ${className}`;

  if (as === "a" && href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  const Tag = as === "section" ? "section" : "div";

  return <Tag className={cls}>{children}</Tag>;
}

/* ---------------- Page header ---------------- */

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Retour",
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <span aria-hidden>←</span>
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? (
          <div className="shrink-0 max-sm:w-full">{action}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Stat tile ---------------- */

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  accent?: "blue" | "emerald" | "amber" | "slate";
}) {
  const accentCls = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-500/15 dark:text-blue-300",
    emerald:
      "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300",
    slate: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
  }[accent ?? "slate"];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {Icon ? (
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${accentCls}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[26px] font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      ) : null}
    </Card>
  );
}

/* ---------------- Badge ---------------- */

const BADGE_TONES = {
  blue: "bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
  amber:
    "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
  red: "bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/20",
  slate:
    "bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/15",
} as const;

export function Badge({
  children,
  tone = "slate",
  className = "",
}: {
  children: React.ReactNode;
  tone?: keyof typeof BADGE_TONES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------------- Avatar ---------------- */

export function Avatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

/* ---------------- Table shell ---------------- */

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
    </Card>
  );
}

export function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`bg-slate-50/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:bg-slate-800/40 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`border-t border-slate-100 px-4 py-3 align-middle dark:border-slate-800/70 ${className}`}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="border-t border-slate-100 px-4 py-12 text-center text-sm text-slate-400 dark:border-slate-800/70"
      >
        {label}
      </td>
    </tr>
  );
}
