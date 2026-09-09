"use client";

import { useState } from "react";

export default function SmartRemindersSetting({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (saving) return;

    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/settings/smart-reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled }),
      });

      if (!response.ok) throw new Error("save_failed");
    } catch {
      setEnabled(!nextEnabled);
      setError("Impossible d’enregistrer ce réglage. Réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="forge-surface rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950 dark:text-white">
            Rappels intelligents
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Recevoir des rappels pour les actions administratives à ne pas oublier.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? "Désactiver" : "Activer"} les rappels intelligents`}
          disabled={saving}
          onClick={toggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${
            enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {saving ? (
        <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Enregistrement…
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
