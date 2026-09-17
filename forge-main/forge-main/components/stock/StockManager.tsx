"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Material = { id: string; workspaceMaterialId: string | null; catalogItemId: string | null; name: string; brand: string | null; reference: string | null; unit: string };
type Movement = { id: string; type: string; quantityDeltaMilli: number; balanceAfterMilli: number; sourceLabel: string | null; note: string | null; createdAt: string };
type StockItem = { id: string; workspaceMaterialId: string; name: string; brand: string | null; reference: string | null; unit: string; quantityMilli: number; reservedQuantityMilli: number; lowStockThresholdMilli: number | null; averageUnitCostCents: number | null; movements: Movement[] };

const quantity = (milli: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(milli / 1000);
const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function StockManager({ initialItems, materials, canWrite }: { initialItems: StockItem[]; materials: Material[]; canWrite: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<StockItem | null>(null);
  const [action, setAction] = useState<"add" | "remove" | "adjust" | "threshold">("add");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const visible = useMemo(() => {
    const target = query.trim().toLocaleLowerCase("fr-FR");
    return target ? initialItems.filter((item) => `${item.name} ${item.brand ?? ""} ${item.reference ?? ""}`.toLocaleLowerCase("fr-FR").includes(target)) : initialItems;
  }, [initialItems, query]);

  async function send(body: Record<string, unknown>) {
    setPending(true); setError("");
    const response = await fetch("/api/stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok && data.code === "STOCK_INSUFFICIENT" && window.confirm(`${data.error} Continuer et afficher un stock négatif ?`)) {
      setPending(false);
      return send({ ...body, confirmNegative: true });
    }
    setPending(false);
    if (!response.ok) { setError(data.error ?? "Mise à jour impossible."); return false; }
    setOpen(false); setActive(null); router.refresh(); return true;
  }

  async function submitInitial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const materialId = String(data.get("materialId") ?? ""); const material = materials.find((item) => item.id === materialId);
    await send(material ? { action: "add", workspaceMaterialId: material.workspaceMaterialId, catalogItemId: material.catalogItemId, quantity: data.get("quantity"), note: "Stock initial" } : { action: "createCustom", name: data.get("name"), unit: data.get("unit"), quantity: data.get("quantity"), note: "Stock initial" });
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!active) return; const data = new FormData(event.currentTarget);
    await send({ action, workspaceMaterialId: active.workspaceMaterialId, quantity: data.get("quantity"), threshold: data.get("quantity"), note: data.get("note") });
  }

  function start(item: StockItem, next: typeof action) { setActive(item); setAction(next); setError(""); }

  return <section className="mt-6">
    <div className="flex gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par désignation, référence ou marque…" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4"/>{canWrite && <button onClick={() => { setOpen(true); setError(""); }} className="shrink-0 rounded-2xl bg-blue-600 px-4 font-semibold text-white">Ajouter</button>}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{visible.map((item) => { const available = item.quantityMilli - item.reservedQuantityMilli; const low = item.lowStockThresholdMilli != null && available <= item.lowStockThresholdMilli; return <article key={item.id} className="forge-surface rounded-3xl border p-5">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-bold text-[var(--forge-text-primary)]">{item.name}</h2><p className="mt-1 text-sm text-[var(--forge-text-muted)]">{[item.brand, item.reference].filter(Boolean).join(" · ") || "Matériel du workspace"}</p></div>{low && <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">Stock faible</span>}</div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center"><div><p className="text-xs text-[var(--forge-text-muted)]">Physique</p><p className="mt-1 font-bold">{quantity(item.quantityMilli)}</p></div><div><p className="text-xs text-[var(--forge-text-muted)]">Réservé</p><p className="mt-1 font-bold">{quantity(item.reservedQuantityMilli)}</p></div><div><p className="text-xs text-[var(--forge-text-muted)]">Disponible</p><p className={`mt-1 font-bold ${available < 0 ? "text-red-600" : "text-blue-600"}`}>{quantity(available)} {item.unit}</p></div></div>
      {item.lowStockThresholdMilli != null && <p className="mt-3 text-xs text-[var(--forge-text-muted)]">Seuil : {quantity(item.lowStockThresholdMilli)} {item.unit}</p>}{item.averageUnitCostCents != null && <p className="mt-1 text-xs text-[var(--forge-text-muted)]">Coût moyen indicatif : {money.format(item.averageUnitCostCents / 100)} / {item.unit}</p>}
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">{canWrite && <><button onClick={() => start(item, "add")} className="rounded-xl border px-3 py-2 text-blue-600">Ajouter</button><button onClick={() => start(item, "remove")} className="rounded-xl border px-3 py-2 text-blue-600">Retirer</button><button onClick={() => start(item, "adjust")} className="rounded-xl border px-3 py-2 text-blue-600">Ajuster</button><button onClick={() => start(item, "threshold")} className="rounded-xl border px-3 py-2 text-blue-600">Seuil</button></>}<button onClick={() => setHistoryId(historyId === item.id ? null : item.id)} className="rounded-xl border px-3 py-2">Historique</button></div>
      {historyId === item.id && <div className="mt-4 space-y-2 border-t border-[var(--forge-border)] pt-4">{item.movements.length ? item.movements.map((movement) => <div key={movement.id} className="flex justify-between gap-3 text-sm"><div><p className="font-semibold">{movement.quantityDeltaMilli > 0 ? "+" : ""}{quantity(movement.quantityDeltaMilli)} {item.unit}</p><p className="text-xs text-[var(--forge-text-muted)]">{movement.sourceLabel || movement.note || movement.type} · {new Date(movement.createdAt).toLocaleDateString("fr-FR")}</p></div><span className="text-xs text-[var(--forge-text-muted)]">Stock {quantity(movement.balanceAfterMilli)}</span></div>) : <p className="text-sm text-[var(--forge-text-muted)]">Aucun mouvement.</p>}</div>}
    </article>; })}</div>
    {!visible.length && <p className="py-14 text-center text-[var(--forge-text-muted)]">Aucun matériel suivi en stock.</p>}
    {(open || active) && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/20 p-3 backdrop-blur-[3px]"><form onSubmit={open ? submitInitial : submitAction} className="forge-surface w-full max-w-lg rounded-3xl border p-5"><h2 className="text-xl font-bold">{open ? "Ajouter au stock" : `${action === "add" ? "Ajouter" : action === "remove" ? "Retirer" : action === "adjust" ? "Ajuster le stock réel" : "Définir le seuil"} · ${active?.name}`}</h2>{open && <><select name="materialId" className="mt-4 min-h-11 w-full rounded-xl border bg-transparent px-3"><option value="">Créer un matériel personnalisé</option>{materials.map((material) => <option key={material.id} value={material.id}>{[material.name, material.brand, material.reference].filter(Boolean).join(" · ")}</option>)}</select><input name="name" placeholder="Désignation si matériel personnalisé" className="mt-3 min-h-11 w-full rounded-xl border bg-transparent px-3"/><input name="unit" defaultValue="u" placeholder="Unité" className="mt-3 min-h-11 w-full rounded-xl border bg-transparent px-3"/></>}<input required name="quantity" min="0" step="0.001" type="number" placeholder={action === "adjust" ? "Stock réel" : action === "threshold" ? "Seuil d’alerte" : "Quantité"} className="mt-3 min-h-11 w-full rounded-xl border bg-transparent px-3"/>{!open && action !== "threshold" && <textarea name="note" placeholder="Motif facultatif" className="mt-3 w-full rounded-xl border bg-transparent p-3"/>}{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setOpen(false); setActive(null); }} className="min-h-12 rounded-xl border font-semibold">Annuler</button><button disabled={pending} className="min-h-12 rounded-xl bg-blue-600 font-semibold text-white">{pending ? "Enregistrement…" : "Valider"}</button></div></form></div>}
  </section>;
}
