"use client";

import Link from "next/link";
import { useActionState } from "react";

export type DocumentCreateFormState = { error: string };

export default function DocumentCreateForm({
  action,
  submitLabel,
  pendingLabel,
  cancelHref,
  children,
}: {
  action: (state: DocumentCreateFormState, formData: FormData) => Promise<DocumentCreateFormState>;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, { error: "" });

  return (
    <form action={formAction} className="forge-surface mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {children}
      {state.error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{state.error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={pending} className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{pending ? pendingLabel : submitLabel}</button>
        <Link href={cancelHref} className="rounded-2xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Annuler</Link>
      </div>
    </form>
  );
}
