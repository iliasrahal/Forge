"use client";

import { Heart, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { materialSearchHaystack, type EffectiveMaterial } from "@/src/lib/material-catalog";
import type { QuoteMaterialSnapshotSource } from "@/src/lib/quote-lines";
import MaterialThumbnail from "@/components/materials/MaterialThumbnail";

export default function MaterialPicker({ open, onClose, onSelect, suggestedMaterialIds = [], title = "Ajouter du matériel" }: { open: boolean; onClose: () => void; onSelect: (material: QuoteMaterialSnapshotSource) => void; suggestedMaterialIds?: string[]; title?: string }) {
  const [materials, setMaterials] = useState<EffectiveMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || materials.length) return;
    fetch("/api/materials").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger le matériel.");
      setMaterials(data.materials);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Impossible de charger le matériel.")).finally(() => setLoading(false));
  }, [open, materials.length]);

  const categories = useMemo(() => [...new Set(materials.map((item) => item.categoryName).filter(Boolean))] as string[], [materials]);
  const normalized = search.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const suggestionOrder = new Map(suggestedMaterialIds.map((id, index) => [id, index]));
  const filtered = materials
    .filter((item) => item.active && (!category || item.categoryName === category) && (!normalized || materialSearchHaystack(item).includes(normalized)))
    .sort((left, right) => (suggestionOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (suggestionOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER));
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 p-3 backdrop-blur-[3px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="material-picker-title">
      <section className="forge-surface flex max-h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--forge-border)] p-4 sm:p-5">
          <div><h2 id="material-picker-title" className="text-xl font-bold text-[var(--forge-text-primary)]">{title}</h2><p className="text-sm text-[var(--forge-text-muted)]">Références du catalogue à vérifier avant sélection</p></div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-11 w-11 place-items-center rounded-xl text-[var(--forge-text-muted)] hover:bg-[var(--forge-surface-hover)]"><X size={20} /></button>
        </header>
        <div className="space-y-3 p-4 sm:p-5">
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-3 text-[var(--forge-text-muted)]" size={18} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une référence, marque ou matériel…" className="h-11 w-full rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] pl-10 pr-3 text-[var(--forge-text-primary)] outline-none focus:border-[var(--forge-accent-blue)]" /></label>
          <div className="flex gap-2 overflow-x-auto pb-1"><button type="button" onClick={() => setCategory("")} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${!category ? "bg-blue-600 text-white" : "bg-[var(--forge-surface-secondary)] text-[var(--forge-text-secondary)]"}`}>Tout</button>{categories.map((name) => <button key={name} type="button" onClick={() => setCategory(name)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${category === name ? "bg-blue-600 text-white" : "bg-[var(--forge-surface-secondary)] text-[var(--forge-text-secondary)]"}`}>{name}</button>)}</div>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
          {loading ? <p className="py-10 text-center text-[var(--forge-text-muted)]">Chargement…</p> : error ? <p className="rounded-xl bg-red-500/10 p-3 text-red-700 dark:text-red-300">{error}</p> : filtered.length ? filtered.map((material) => (
            <button key={material.id} type="button" onClick={() => { onSelect(material); onClose(); }} className="flex w-full items-center gap-3 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-3 text-left transition hover:border-blue-400 sm:p-4">
              <MaterialThumbnail image={material.primaryImage} name={material.name} className="h-20 w-20 sm:h-24 sm:w-24" />
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2 font-semibold text-[var(--forge-text-primary)]">{material.name}{material.favorite ? <Heart size={15} className="fill-pink-500 text-pink-500" /> : null}</span><span className="mt-1 block text-sm text-[var(--forge-text-muted)]">{[material.brand, material.reference, material.categoryName].filter(Boolean).join(" · ") || "Matériel personnalisé"}</span>{Object.keys(material.specifications).length ? <span className="mt-1 block text-xs text-[var(--forge-text-muted)]">{Object.entries(material.specifications).slice(0, 3).map(([name, value]) => `${name} : ${value}`).join(" · ")}</span> : null}{material.supplier ? <span className="mt-1 block text-xs text-[var(--forge-text-muted)]">Fournisseur : {material.supplier}</span> : null}</span>
              <span className="shrink-0 text-right"><span className="block font-bold text-[var(--forge-accent-blue-lit)]">{material.salePriceCents > 0 ? `${(material.salePriceCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €` : "Prix à compléter"}</span><span className="mt-1 block text-sm font-bold text-blue-600 dark:text-blue-400">Choisir</span></span>
            </button>
          )) : <p className="py-10 text-center text-[var(--forge-text-muted)]">Aucun matériel correspondant.</p>}
        </div>
      </section>
    </div>
  );
}
