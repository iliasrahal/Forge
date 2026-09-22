"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { MARKETPLACE_TRADES } from "@/src/lib/marketplace";

type InitialPosting = {
  id: string;
  title: string;
  trade: string;
  trades: string[];
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  positions: number;
  budgetCents: number | null;
};

export default function MarketplacePostingForm({ initialPosting }: { initialPosting?: InitialPosting }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError("");
    const formData = new FormData(event.currentTarget);
    const body = { ...Object.fromEntries(formData), trades: formData.getAll("trades") };
    const response = await fetch(initialPosting ? `/api/marketplace/${initialPosting.id}` : "/api/marketplace", {
      method: initialPosting ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Impossible d’enregistrer l’annonce.");
      return;
    }
    router.push(`/marketplace/${initialPosting?.id ?? data.posting.id}`);
    router.refresh();
  }

  return <form onSubmit={submit} className="forge-surface mt-6 grid gap-4 rounded-3xl border p-5 sm:grid-cols-2 sm:p-7">
    <label className="sm:col-span-2 text-sm font-semibold">Titre<input required name="title" maxLength={140} defaultValue={initialPosting?.title ?? ""} placeholder="Besoin d’un plombier en renfort" className="mt-1.5 min-h-12 w-full rounded-xl border bg-transparent px-3 font-normal"/></label>
    <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold">Métiers recherchés</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{MARKETPLACE_TRADES.map((trade) => <label key={trade} className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm"><input type="checkbox" name="trades" value={trade} defaultChecked={(initialPosting?.trades ?? [initialPosting?.trade].filter(Boolean)).includes(trade)}/><span>{trade}</span></label>)}</div></fieldset>
    <label className="text-sm font-semibold">Ville / zone<input required name="location" maxLength={120} defaultValue={initialPosting?.location ?? ""} placeholder="Saint-Denis" className="mt-1.5 min-h-12 w-full rounded-xl border bg-transparent px-3 font-normal"/></label>
    <label className="text-sm font-semibold">Début<input required name="startDate" type="date" defaultValue={initialPosting?.startDate ?? ""} className="mt-1.5 min-h-12 w-full rounded-xl border bg-transparent px-3 font-normal"/></label>
    <label className="text-sm font-semibold">Fin<input required name="endDate" type="date" defaultValue={initialPosting?.endDate ?? ""} className="mt-1.5 min-h-12 w-full rounded-xl border bg-transparent px-3 font-normal"/></label>
    <label className="text-sm font-semibold">Nombre de places<input required name="positions" type="number" min="1" max="20" defaultValue={initialPosting?.positions ?? 1} className="mt-1.5 min-h-12 w-full rounded-xl border bg-transparent px-3 font-normal"/></label>
    <label className="text-sm font-semibold">Budget facultatif (€)<input name="budget" type="number" min="0" step="0.01" defaultValue={initialPosting?.budgetCents == null ? "" : initialPosting.budgetCents / 100} className="mt-1.5 min-h-12 w-full rounded-xl border bg-transparent px-3 font-normal"/></label>
    <label className="sm:col-span-2 text-sm font-semibold">Description publique<textarea required name="description" maxLength={2000} defaultValue={initialPosting?.description ?? ""} placeholder="Décris brièvement le travail et le renfort recherché." className="mt-1.5 min-h-32 w-full rounded-xl border bg-transparent p-3 font-normal"/></label>
    {error ? <p className="sm:col-span-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    <div className="grid grid-cols-2 gap-3 sm:col-span-2">
      <button type="button" onClick={() => router.back()} className="min-h-12 rounded-xl border font-semibold">Annuler</button>
      <button disabled={pending} className="min-h-12 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-60">{pending ? "Enregistrement…" : initialPosting ? "Enregistrer" : "Publier"}</button>
    </div>
  </form>;
}
