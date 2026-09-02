"use client";

import { Mail } from "lucide-react";
import { useState } from "react";

const reasons = [
  { label: "Problème avec mon compte", subject: "Forge - Problème avec mon compte" },
  {
    label: "Problème de connexion ou mot de passe",
    subject: "Forge - Problème de connexion",
  },
  { label: "Abonnement / paiement", subject: "Forge - Abonnement" },
  { label: "Problème technique", subject: "Forge - Problème technique" },
  { label: "Équipe / invitation", subject: "Forge - Équipe ou invitation" },
  { label: "Devis ou factures", subject: "Forge - Devis ou factures" },
  { label: "Autre demande", subject: "Forge - Autre demande" },
] as const;

export default function ContactSupportForm() {
  const [subject, setSubject] = useState<string>(reasons[0].subject);
  const mailto = `mailto:contact@myforge.online?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="mt-8 space-y-6">
      <div>
        <label
          htmlFor="support-reason"
          className="mb-2 block text-sm font-semibold text-[var(--forge-text-secondary)]"
        >
          Motif de votre demande
        </label>
        <select
          id="support-reason"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="h-14 w-full rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-4 text-base text-[var(--forge-text-primary)] outline-none transition focus:border-[var(--forge-accent-blue)] focus:ring-4 focus:ring-blue-500/15"
        >
          {reasons.map((reason) => (
            <option key={reason.subject} value={reason.subject}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>

      <a
        href={mailto}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(100deg,var(--forge-accent-blue-lit),var(--forge-accent-blue)_58%,var(--forge-accent-pink))] px-6 py-3 text-center text-base font-semibold text-white shadow-[0_18px_38px_-22px_rgba(76,110,245,0.82)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
      >
        <Mail aria-hidden="true" size={19} />
        Contacter l’équipe Forge
      </a>
    </div>
  );
}
