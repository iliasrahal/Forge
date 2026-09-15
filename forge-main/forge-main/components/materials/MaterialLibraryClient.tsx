"use client";

import { Heart, Pencil, Plus, Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { materialSearchHaystack, type EffectiveMaterial } from "@/src/lib/material-catalog";
import MaterialThumbnail from "@/components/materials/MaterialThumbnail";

const emptyForm = { name: "", brand: "", reference: "", description: "", specifications: "", tags: "", unit: "u", purchasePrice: "", salePrice: "", supplier: "", favorite: false, active: true };

function price(cents: number | null) { return cents == null ? "" : (cents / 100).toFixed(2).replace(".", ","); }
function specText(specs: Record<string, string>) { return Object.entries(specs).map(([key, value]) => `${key}: ${value}`).join("\n"); }
function parseSpecs(value: string) { return Object.fromEntries(value.split("\n").map((line) => line.split(":" )).filter((parts) => parts.length > 1 && parts[0].trim()).map(([key, ...rest]) => [key.trim(), rest.join(":").trim()])); }

export default function MaterialLibraryClient({ initialMaterials, canWrite }: { initialMaterials: EffectiveMaterial[]; canWrite: boolean }) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<EffectiveMaterial | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const categories = useMemo(() => [...new Set(materials.map((item) => item.categoryName).filter(Boolean))] as string[], [materials]);
  const normalized = search.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const filtered = materials.filter((item) => (!category || item.categoryName === category) && (!normalized || materialSearchHaystack(item).includes(normalized)));

  function openCreate() { setEditing(null); setForm(emptyForm); setImage(null); setError(""); setShowForm(true); }
  function openEdit(item: EffectiveMaterial) { setEditing(item); setForm({ name: item.name, brand: item.brand, reference: item.reference, description: item.description, specifications: specText(item.specifications), tags: item.tags.join(", "), unit: item.unit, purchasePrice: price(item.purchasePriceCents), salePrice: price(item.salePriceCents), supplier: item.supplier, favorite: item.favorite, active: item.active }); setImage(null); setError(""); setShowForm(true); }

  async function reload() { const response = await fetch("/api/materials"); const data = await response.json(); if (response.ok) setMaterials(data.materials); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!canWrite || saving) return; setSaving(true); setError("");
    const body = { ...form, specifications: parseSpecs(form.specifications), tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean), catalogItemId: editing?.catalogItemId ?? null };
    const hasWorkspaceRecord = editing?.workspaceMaterialId;
    const response = await fetch(hasWorkspaceRecord ? `/api/materials/${hasWorkspaceRecord}` : "/api/materials", { method: hasWorkspaceRecord ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setSaving(false); setError(data.error || "Impossible d’enregistrer le matériel."); return; }
    if (image && data.material?.id) {
      const imageData = new FormData(); imageData.set("image", image); imageData.set("isPrimary", "true");
      const imageResponse = await fetch(`/api/materials/${data.material.id}/images`, { method: "POST", body: imageData });
      const imagePayload = await imageResponse.json().catch(() => ({}));
      if (!imageResponse.ok) { setSaving(false); setError(imagePayload.error || "Le matériel est enregistré, mais sa photo n’a pas pu être ajoutée."); await reload(); return; }
    }
    setSaving(false);
    await reload(); setShowForm(false);
  }

  async function toggleFavorite(item: EffectiveMaterial) {
    if (!canWrite) return;
    const body = { name: item.catalogItemId ? "" : item.name, brand: item.brand, reference: item.reference, description: item.description, specifications: item.specifications, tags: item.tags, unit: item.unit, purchasePrice: price(item.purchasePriceCents), salePrice: price(item.salePriceCents), supplier: item.supplier, favorite: !item.favorite, active: item.active, catalogItemId: item.catalogItemId };
    await fetch(item.workspaceMaterialId ? `/api/materials/${item.workspaceMaterialId}` : "/api/materials", { method: item.workspaceMaterialId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await reload();
  }

  return <div className="mt-6 space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-4 top-3.5 text-[var(--forge-text-muted)]" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un matériel…" className="h-12 w-full rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] pl-11 pr-4 text-[var(--forge-text-primary)]" /></label>{canWrite ? <button type="button" onClick={openCreate} className="min-h-12 rounded-2xl bg-blue-600 px-5 font-semibold text-white"><Plus className="mr-2 inline" size={18} />Matériel personnalisé</button> : null}</div>
    <div className="flex gap-2 overflow-x-auto pb-1"><button type="button" onClick={() => setCategory("")} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${!category ? "bg-blue-600 text-white" : "bg-[var(--forge-surface-secondary)] text-[var(--forge-text-secondary)]"}`}>Tout</button>{categories.map((name) => <button key={name} type="button" onClick={() => setCategory(name)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${category === name ? "bg-blue-600 text-white" : "bg-[var(--forge-surface-secondary)] text-[var(--forge-text-secondary)]"}`}>{name}</button>)}</div>
    <div className="grid gap-3 sm:grid-cols-2">{filtered.map((item) => <article key={item.id} className={`forge-surface rounded-2xl border p-4 ${item.active ? "" : "opacity-55"}`}><div className="flex items-start gap-3"><MaterialThumbnail image={item.primaryImage} name={item.name} className="h-16 w-16" /><div className="min-w-0 flex-1"><p className="font-bold text-[var(--forge-text-primary)]">{item.name}</p><p className="mt-1 text-sm text-[var(--forge-text-muted)]">{[item.brand, item.reference, item.categoryName].filter(Boolean).join(" · ")}</p></div>{canWrite ? <><button type="button" onClick={() => void toggleFavorite(item)} aria-label={item.favorite ? "Retirer des favoris" : "Ajouter aux favoris"} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-[var(--forge-surface-hover)]"><Heart size={18} className={item.favorite ? "fill-pink-500 text-pink-500" : "text-[var(--forge-text-muted)]"} /></button><button type="button" onClick={() => openEdit(item)} aria-label="Modifier" className="grid h-10 w-10 place-items-center rounded-xl text-blue-600 hover:bg-blue-500/10"><Pencil size={18} /></button></> : null}</div><div className="mt-3 flex justify-between text-sm"><span className="text-[var(--forge-text-muted)]">Achat {item.purchasePriceCents == null ? "—" : `${price(item.purchasePriceCents)} €`}</span><strong className="text-[var(--forge-text-primary)]">Vente {price(item.salePriceCents)} €</strong></div>{item.isFixture ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-600">Fixture technique</p> : null}</article>)}</div>
    {showForm ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 p-3 backdrop-blur-[3px]"><form onSubmit={save} className="forge-surface max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom))] w-full max-w-xl overflow-y-auto rounded-[2rem] border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"><h2 className="text-xl font-bold text-[var(--forge-text-primary)]">{editing ? "Modifier le matériel" : "Matériel personnalisé"}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><input required={!editing?.catalogItemId} value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder="Nom" className="h-11 rounded-xl border bg-transparent px-3" /><input value={form.brand} onChange={(e) => setForm({...form,brand:e.target.value})} placeholder="Marque" className="h-11 rounded-xl border bg-transparent px-3" /><input value={form.reference} onChange={(e) => setForm({...form,reference:e.target.value})} placeholder="Référence" className="h-11 rounded-xl border bg-transparent px-3" /><input value={form.supplier} onChange={(e) => setForm({...form,supplier:e.target.value})} placeholder="Fournisseur" className="h-11 rounded-xl border bg-transparent px-3" /><input value={form.purchasePrice} onChange={(e) => setForm({...form,purchasePrice:e.target.value})} inputMode="decimal" placeholder="Prix d'achat €" className="h-11 rounded-xl border bg-transparent px-3" /><input required value={form.salePrice} onChange={(e) => setForm({...form,salePrice:e.target.value})} inputMode="decimal" placeholder="Prix de vente €" className="h-11 rounded-xl border bg-transparent px-3" /><input value={form.unit} onChange={(e) => setForm({...form,unit:e.target.value})} placeholder="Unité" className="h-11 rounded-xl border bg-transparent px-3" /><input value={form.tags} onChange={(e) => setForm({...form,tags:e.target.value})} placeholder="Tags séparés par virgules" className="h-11 rounded-xl border bg-transparent px-3" /></div><textarea value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="Description" rows={2} className="mt-3 w-full rounded-xl border bg-transparent p-3" /><textarea value={form.specifications} onChange={(e) => setForm({...form,specifications:e.target.value})} placeholder={'Caractéristiques, une par ligne\nDiamètre: 20/27'} rows={3} className="mt-3 w-full rounded-xl border bg-transparent p-3" /><label className="mt-3 block rounded-xl border border-dashed border-[var(--forge-border-strong)] p-3 text-sm font-semibold text-[var(--forge-text-secondary)]">Photo du matériel (facultative)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm" /></label><div className="mt-3 flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={form.favorite} onChange={(e) => setForm({...form,favorite:e.target.checked})} /> Favori</label><label><input type="checkbox" checked={form.active} onChange={(e) => setForm({...form,active:e.target.checked})} /> Actif</label></div>{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}<div className="sticky bottom-0 mt-5 grid grid-cols-2 gap-3 bg-[var(--forge-surface)] pt-3"><button type="button" onClick={() => setShowForm(false)} className="min-h-12 rounded-xl border font-semibold">Annuler</button><button disabled={saving} className="min-h-12 rounded-xl bg-blue-600 font-semibold text-white">{saving ? "Enregistrement…" : "Enregistrer"}</button></div></form></div> : null}
  </div>;
}
