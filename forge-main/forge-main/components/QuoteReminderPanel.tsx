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
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function prepare() {
    if (!hasEmail) {
      setError("Aucune adresse e-mail n’est renseignée pour ce client.");
      setOpen(true);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/quotes/${quoteId}/reminders/prepare`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "La relance n’a pas pu être préparée.");
      setMessage(data.message);
    } catch (preparationError) {
      setError(preparationError instanceof Error ? preparationError.message : "La relance n’a pas pu être préparée.");
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/quotes/${quoteId}/reminders/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "La relance n’a pas pu être envoyée.");
      setNotice("Relance envoyée avec succès.");
      setOpen(false);
      setMessage("");
      router.refresh();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "La relance n’a pas pu être envoyée.");
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
                ? "Vous pouvez préparer une relance manuelle si nécessaire."
                : canPrepare
                  ? "Ce devis est toujours en attente d’une réponse."
                  : "Les relances déjà envoyées restent consultables."}
          </p>
        </div>
      </div>

      {canWrite && canPrepare ? (
        <button type="button" onClick={prepare} disabled={loading || sending} className="mt-4 min-h-12 w-full rounded-2xl border border-blue-500/50 px-4 font-semibold text-[var(--forge-accent-blue-lit)] transition hover:bg-blue-500/10 disabled:opacity-60">
          {loading ? "Préparation…" : "Préparer une relance"}
        </button>
      ) : null}

      {open && canWrite && canPrepare ? (
        <div className="mt-4 border-t border-[var(--forge-border)] pt-4">
          <label className="text-sm font-semibold text-[var(--forge-text-primary)]">Message de relance
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={10} maxLength={5_000} disabled={loading || !hasEmail} className="mt-2 w-full resize-y rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-input-background)] p-4 text-base leading-6 text-[var(--forge-text-primary)] outline-none focus:border-blue-500" />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { setOpen(false); setError(""); }} disabled={sending} className="min-h-12 rounded-2xl border border-[var(--forge-border)] px-4 font-semibold text-[var(--forge-text-primary)]">Annuler</button>
            <button type="button" onClick={send} disabled={sending || loading || !message.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-4 font-bold text-white disabled:opacity-60"><Send size={17} />{sending ? "Envoi…" : "Envoyer la relance"}</button>
          </div>
        </div>
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
