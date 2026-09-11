"use client";

import { BellRing, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  quoteId: string;
  canWrite: boolean;
  canPrepare: boolean;
  hasEmail: boolean;
  automaticLevel: 1 | 2 | null;
  daysSinceActivity: number | null;
  reminders: Array<{ id: string; sentAt: string | Date; channel: string }>;
};

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function QuoteReminderPanel({ quoteId, canWrite, canPrepare, hasEmail, automaticLevel, daysSinceActivity, reminders }: Props) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function relaunch() {
    if (sending) return;
    if (!hasEmail) {
      setError("Aucune adresse e-mail n’est renseignée pour ce client.");
      return;
    }
    setSending(true);
    setError("");
    setNotice("");
    try {
      // Un seul clic : le message est généré côté serveur (IA si configurée,
      // sinon modèle standard) puis envoyé immédiatement, sans étape de relecture.
      const prepareResponse = await fetch(`/api/quotes/${quoteId}/reminders/prepare`, { method: "POST" });
      const prepareData = await prepareResponse.json();
      if (!prepareResponse.ok) throw new Error(prepareData.error || "La relance n’a pas pu être préparée.");

      const sendResponse = await fetch(`/api/quotes/${quoteId}/reminders/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prepareData.message }),
      });
      const sendData = await sendResponse.json();
      if (!sendResponse.ok) throw new Error(sendData.error || "La relance n’a pas pu être envoyée.");

      setNotice("Relance envoyée avec succès.");
      router.refresh();
    } catch (relaunchError) {
      setError(relaunchError instanceof Error ? relaunchError.message : "La relance n’a pas pu être envoyée.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-[var(--forge-accent-blue-lit)]"><BellRing size={19} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--forge-text-primary)]">
            {automaticLevel ? `Relance ${automaticLevel === 1 ? "conseillée" : "à renouveler"}` : canPrepare ? "Suivi du devis" : "Historique des relances"}
          </p>
          <p className="mt-1 text-sm text-[var(--forge-text-secondary)]">
            {automaticLevel && daysSinceActivity !== null
              ? `Ce devis est sans réponse depuis ${daysSinceActivity} jour${daysSinceActivity > 1 ? "s" : ""}.`
              : canPrepare && canWrite
                ? "Vous pouvez relancer manuellement si nécessaire."
                : canPrepare
                  ? "Ce devis est toujours en attente d’une réponse."
                  : "Les relances déjà envoyées restent consultables."}
          </p>
        </div>
      </div>

      {canWrite && canPrepare ? (
        <button
          type="button"
          onClick={relaunch}
          disabled={sending}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-4 font-bold text-white transition disabled:opacity-60"
        >
          <Send size={17} />
          {sending ? "Envoi…" : "Relancer"}
        </button>
      ) : null}

      {error ? <p className="mt-3 text-sm font-medium text-red-500">{error}</p> : null}
      {notice ? <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{notice}</p> : null}

      {reminders.length > 0 ? (
        <div className="mt-4 border-t border-[var(--forge-border)] pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--forge-text-muted)]">Historique</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--forge-text-secondary)]">
            {reminders.map((reminder, index) => <li key={reminder.id}>Relance {reminders.length - index} envoyée par e-mail le {formatDateTime(reminder.sentAt)}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
