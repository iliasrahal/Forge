"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function AccessError({ message, subscriptionRequired }: { message: string; subscriptionRequired: boolean }) {
  return <div className="mt-3 text-sm font-medium text-red-600 dark:text-red-400"><p>{message}</p>{subscriptionRequired ? <Link href="/subscription" className="mt-2 inline-flex rounded-full border border-blue-300 px-3 py-2 text-blue-700 dark:text-blue-300">Réactiver mon abonnement</Link> : null}</div>;
}

export function MarketplaceApply({ postingId, canWrite, subscriptionRequired, existingStatus }: { postingId: string; canWrite: boolean; subscriptionRequired: boolean; existingStatus?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; subscriptionRequired: boolean } | null>(null);
  if (existingStatus) return <p className="rounded-2xl bg-blue-50 px-4 py-3 text-center text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">Demande déjà envoyée · {existingStatus}</p>;
  if (!canWrite) return <div className="text-center"><p className="text-sm text-[var(--forge-text-secondary)]">Consultation seule.</p>{subscriptionRequired ? <Link href="/subscription" className="mt-2 inline-flex rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300">Réactiver mon abonnement</Link> : null}</div>;
  async function submit() {
    setPending(true); setError(null);
    const message = (document.getElementById("marketplace-message") as HTMLTextAreaElement | null)?.value ?? "";
    const response = await fetch(`/api/marketplace/${postingId}/applications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
    const data = await response.json().catch(() => ({})); setPending(false);
    if (!response.ok) return setError({ message: data.error ?? "Demande impossible.", subscriptionRequired: data.subscriptionRequired === true });
    setOpen(false); router.refresh();
  }
  return <div>{!open ? <button onClick={() => setOpen(true)} className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 font-semibold text-white">Demander à rejoindre</button> : <div className="rounded-2xl border p-4"><label className="text-sm font-semibold">Message facultatif<textarea id="marketplace-message" maxLength={1000} placeholder="Bonjour, je suis disponible sur cette période." className="mt-2 min-h-24 w-full rounded-xl border bg-transparent p-3 font-normal"/></label><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setOpen(false)} className="min-h-11 rounded-xl border font-semibold">Annuler</button><button disabled={pending} onClick={() => void submit()} className="min-h-11 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-60">Envoyer</button></div></div>}{error ? <AccessError {...error}/> : null}</div>;
}

export function MarketplacePostingActions({ postingId, canWrite }: { postingId: string; canWrite: boolean }) {
  const router = useRouter(); const [error, setError] = useState("");
  if (!canWrite) return null;
  async function close() {
    if (!window.confirm("Fermer cette annonce ? Elle n’acceptera plus de demandes.")) return;
    const response = await fetch(`/api/marketplace/${postingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "close" }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setError(data.error ?? "Fermeture impossible.");
    router.refresh();
  }
  return <div className="mt-5 flex flex-wrap gap-3"><Link href={`/marketplace/${postingId}/edit`} className="inline-flex min-h-11 items-center rounded-xl border px-4 font-semibold text-blue-600">Modifier</Link><button onClick={() => void close()} className="min-h-11 rounded-xl border border-red-300 px-4 font-semibold text-red-600">Fermer</button>{error ? <p className="w-full text-sm text-red-600">{error}</p> : null}</div>;
}

export function MarketplaceApplicationAction({ applicationId, action }: { applicationId: string; action: "accept" | "reject" | "cancel" }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function update() { setPending(true); setError(""); const response = await fetch(`/api/marketplace/applications/${applicationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); const data = await response.json().catch(() => ({})); setPending(false); if (!response.ok) return setError(data.error ?? "Action impossible."); router.refresh(); }
  const label = action === "accept" ? "Accepter" : action === "reject" ? "Refuser" : "Annuler la demande";
  return <span><button disabled={pending} onClick={() => void update()} className={`min-h-10 rounded-xl border px-3 text-sm font-semibold disabled:opacity-60 ${action === "accept" ? "border-emerald-300 text-emerald-700" : action === "reject" ? "border-red-300 text-red-600" : "text-slate-600"}`}>{label}</button>{error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}</span>;
}
