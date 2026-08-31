"use client";

import { useState, useTransition } from "react";

type Result = { ok: true } | { ok: false; error: string } | Record<string, unknown>;

export default function AsyncButton({
  action,
  children,
  confirm,
  onDone,
  variant = "default",
  className = "",
}: {
  action: () => Promise<Result>;
  children: React.ReactNode;
  confirm?: string;
  onDone?: (result: Result) => void;
  variant?: "default" | "primary" | "danger";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { tone: "error" | "ok"; text: string } | null
  >(null);

  const base =
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50";
  const variants = {
    default:
      "border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        className={`${base} ${variants[variant]} ${className}`}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setMessage(null);
          startTransition(async () => {
            const result = await action();
            if ("ok" in result && result.ok === false) {
              setMessage({ tone: "error", text: String(result.error) });
            } else {
              setMessage({ tone: "ok", text: "Fait." });
            }
            onDone?.(result);
          });
        }}
      >
        {pending ? "…" : children}
      </button>
      {message ? (
        <span
          className={
            message.tone === "error"
              ? "text-xs text-red-600 dark:text-red-400"
              : "text-xs text-emerald-600 dark:text-emerald-400"
          }
        >
          {message.text}
        </span>
      ) : null}
    </span>
  );
}
