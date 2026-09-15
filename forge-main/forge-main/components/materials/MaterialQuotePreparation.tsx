"use client";

import { useEffect, useMemo, useState } from "react";

import { buildAnalysisQuoteTitle, buildPreparedQuoteLines, suggestServicesForMaterial, type SuggestibleService } from "@/src/lib/material-service-suggestions";
import type { MaterialIdentification } from "@/src/lib/material-matching";
import type { EditableQuoteLine, QuoteMaterialSnapshotSource } from "@/src/lib/quote-lines";
import { formatServicePrice } from "@/src/lib/service-catalog";
import MaterialThumbnail from "@/components/materials/MaterialThumbnail";

export default function MaterialQuotePreparation({ material, identification, onBack, onCancel, onContinue, submitLabel = "Créer un devis à partir de l’analyse" }: {
  material: QuoteMaterialSnapshotSource | null;
  identification: MaterialIdentification;
  onBack: () => void;
  onCancel: () => void;
  onContinue: (lines: EditableQuoteLine[], title: string) => void;
  submitLabel?: "Créer un devis à partir de l’analyse" | "Ajouter au devis";
}) {
  const [quantity, setQuantity] = useState("1");
  const [quantityConfirmed, setQuantityConfirmed] = useState(false);
  const [services, setServices] = useState<SuggestibleService[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/service-catalog").then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error("SERVICES_UNAVAILABLE");
      if (active) setServices(Array.isArray(payload.services) ? payload.services : []);
    }).catch(() => { if (active) setServices([]); }).finally(() => { if (active) setLoadingServices(false); });
    return () => { active = false; };
  }, []);

  const materialForSuggestions = useMemo<QuoteMaterialSnapshotSource>(() => material ?? ({ catalogItemId: null, workspaceMaterialId: null, name: identification.equipmentType || "", brand: identification.brand || "", reference: identification.reference || "", specifications: Object.fromEntries(identification.visibleCharacteristics.map(({ name, value }) => [name, value])), supplier: "", salePriceCents: 0, purchasePriceCents: null, unit: "u" }), [identification, material]);
  const suggestions = useMemo(() => suggestServicesForMaterial(materialForSuggestions, identification, services), [identification, materialForSuggestions, services]);
  const validQuantity = /^\d+(?:[.,]\d{1,3})?$/.test(quantity.trim()) && Number(quantity.replace(",", ".")) > 0;

  function continueWith(selectedIds: string[]) {
    if (!validQuantity || !quantityConfirmed) return;
    const selectedServices = suggestions.filter((service) => selectedIds.includes(service.id));
    onContinue(buildPreparedQuoteLines(material, identification, quantity, selectedServices), buildAnalysisQuoteTitle(material, identification));
  }

  return (
    <section className="forge-surface rounded-3xl border p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Préparer le devis</p><h2 className="mt-1 text-xl font-bold text-[var(--forge-text-primary)]">Matériel choisi</h2></div><button type="button" onClick={onCancel} className="text-sm font-semibold text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]">Fermer</button></div>

      <div className="mt-4 rounded-2xl bg-[var(--forge-surface-secondary)] p-4">
        <div className="flex items-start gap-3"><MaterialThumbnail image={material?.primaryImage} name={material?.name || identification.equipmentType || "Matériel"} className="h-20 w-20" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">{material ? "Matériel sélectionné" : "Analyse du matériel"}</p><p className="mt-1 font-bold text-[var(--forge-text-primary)]">{material?.name || identification.equipmentType || "Matériel à préciser"}</p><p className="mt-1 text-sm text-[var(--forge-text-muted)]">{material ? ([material.brand, material.reference].filter(Boolean).join(" · ") || "Référence personnalisée") : "Aucune référence catalogue sélectionnée"}</p></div><p className="font-bold text-blue-600 dark:text-blue-400">{material && material.salePriceCents > 0 ? formatServicePrice(material.salePriceCents) : "Prix à compléter"}</p></div>{(material ? Object.keys(material.specifications).length : identification.visibleCharacteristics.length) ? <p className="mt-3 text-sm text-[var(--forge-text-secondary)]">{material ? Object.entries(material.specifications).slice(0, 5).map(([name, value]) => `${name} : ${value}`).join(" · ") : identification.visibleCharacteristics.slice(0, 5).map(({ name, value }) => `${name} : ${value}`).join(" · ")}</p> : null}<button type="button" onClick={onBack} className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400">Changer</button></div></div>
      </div>

      <div className="mt-5"><label htmlFor="material-quote-quantity" className="text-sm font-bold text-[var(--forge-text-primary)]">Quantité</label><input id="material-quote-quantity" value={quantity} inputMode="decimal" onChange={(event) => { setQuantity(event.target.value); setQuantityConfirmed(false); }} className="mt-2 h-12 w-full rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] px-3 text-[var(--forge-text-primary)]" />{!validQuantity ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">Saisis une quantité supérieure à zéro.</p> : null}<label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-[var(--forge-surface-secondary)] px-3 text-sm font-semibold text-[var(--forge-text-secondary)]"><input type="checkbox" checked={quantityConfirmed} disabled={!validQuantity} onChange={(event) => setQuantityConfirmed(event.target.checked)} className="h-5 w-5" />Je confirme cette quantité</label></div>

      {!loadingServices && suggestions.length ? <fieldset className="mt-5"><legend className="font-bold text-[var(--forge-text-primary)]">Prestations possibles</legend><p className="mt-1 text-sm text-[var(--forge-text-muted)]">Uniquement parmi vos prestations enregistrées.</p><div className="mt-3 space-y-2">{suggestions.map((service) => <label key={service.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-3"><input type="checkbox" checked={selectedServiceIds.includes(service.id)} onChange={(event) => setSelectedServiceIds((current) => event.target.checked ? [...current, service.id] : current.filter((id) => id !== service.id))} className="h-5 w-5 shrink-0" /><span className="min-w-0 flex-1"><span className="block font-semibold text-[var(--forge-text-primary)]">{service.name}</span><span className="block text-sm text-[var(--forge-text-muted)]">{formatServicePrice(service.priceCents)}</span></span></label>)}</div></fieldset> : null}

      <div className="mt-6 grid grid-cols-1 gap-2 border-t border-[var(--forge-border)] pt-4 sm:grid-cols-2"><button type="button" disabled={!quantityConfirmed || !validQuantity} onClick={() => continueWith([])} className="min-h-12 rounded-xl border border-[var(--forge-border-strong)] px-4 font-semibold text-[var(--forge-text-primary)] disabled:opacity-40">Continuer sans prestation</button><button type="button" disabled={!quantityConfirmed || !validQuantity} onClick={() => continueWith(selectedServiceIds)} className="min-h-12 rounded-xl bg-gradient-to-r from-blue-600 to-pink-500 px-4 font-semibold text-white disabled:opacity-40">{submitLabel}</button></div>
    </section>
  );
}
