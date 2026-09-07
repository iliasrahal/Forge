"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SmartReminder } from "@/src/lib/smart-reminders";

export default function HomeReminders({
  reminders,
  canWrite,
}: {
  reminders: SmartReminder[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (reminders.length === 0) return null;

  async function createInvoice(reminder: SmartReminder) {
    if (!reminder.interventionId) return;
    setCreatingFor(reminder.id);
    setError("");
    try {
      const response = await fetch("/api/invoices/create-from-intervention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interventionId: reminder.interventionId }),
      });
      const data = await response.json();
      if (!response.ok || !data.invoice?.id) {
        throw new Error(data.error ?? "Impossible de créer la facture.");
      }
      router.push(`/invoices/${data.invoice.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Impossible de créer la facture.");
    } finally {
      setCreatingFor(null);
    }
  }

  return (
    <section className="mb-5 rounded-3xl border border-blue-200/70 bg-white/55 p-4 backdrop-blur-sm dark:border-blue-900/70 dark:bg-slate-950/35 sm:p-5">
      <h2 className="text-center text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
        À ne pas oublier
      </h2>
      <div className="mt-3 space-y-2.5">
        {reminders.map((reminder) => (
          <article key={reminder.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-3.5 dark:border-slate-700/80 dark:bg-slate-900/65 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-center sm:text-left">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{reminder.title}</p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{reminder.detail}</p>
            </div>
            {canWrite ? (
              reminder.kind === "INTERVENTION_UNBILLED" && reminder.interventionId ? (
                <button
                  type="button"
                  disabled={creatingFor === reminder.id}
                  onClick={() => createInvoice(reminder)}
                  className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {creatingFor === reminder.id ? "Création…" : reminder.actionLabel}
                </button>
              ) : (
                <Link href={reminder.href} className="shrink-0 rounded-xl border border-blue-500 px-4 py-2 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950">
                  {reminder.actionLabel}
                </Link>
              )
            ) : null}
          </article>
        ))}
      </div>
      {error ? <p className="mt-3 text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </section>
  );
}
