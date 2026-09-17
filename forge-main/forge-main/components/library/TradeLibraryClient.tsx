"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import MaterialLibraryClient from "@/components/materials/MaterialLibraryClient";
import ServiceCatalogClient, { type CatalogService } from "@/components/services/ServiceCatalogClient";
import type { EffectiveMaterial } from "@/src/lib/material-catalog";

type WorkTemplate = { id: string; name: string; title: string; category: string | null; favorite: boolean; active: boolean; lineCount: number; source: "forge" | "workspace" };
type Tab = "materials" | "services" | "labor" | "works";

export default function TradeLibraryClient({ materials, services, works, canWrite }: { materials: EffectiveMaterial[]; services: CatalogService[]; works: WorkTemplate[]; canWrite: boolean }) {
  const [tab, setTab] = useState<Tab>("materials");
  const [copying, setCopying] = useState<string | null>(null);
  const router = useRouter();
  const filteredServices = useMemo(() => services.filter((service) => tab === "labor" ? service.lineType === "LABOR" : service.lineType !== "LABOR"), [services, tab]);
  const tabs: Array<{ value: Tab; label: string }> = [{ value: "materials", label: "Matériaux" }, { value: "services", label: "Prestations" }, { value: "labor", label: "Main-d’œuvre" }, { value: "works", label: "Ouvrages" }];
  async function duplicateWork(id: string) { setCopying(id); const response = await fetch(`/api/quote-templates/${id}/duplicate`, { method: "POST" }); const data = await response.json().catch(() => ({})); setCopying(null); if (response.ok && data.id) router.push(`/settings/quote-templates/${data.id}/edit`); }
  return <div className="mt-6">
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-2 sm:grid-cols-4">{tabs.map((item) => <button key={item.value} type="button" onClick={() => setTab(item.value)} className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition ${tab === item.value ? "bg-blue-600 text-white shadow-sm" : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-surface-hover)]"}`}>{item.label}</button>)}</div>
    {tab === "materials" && <MaterialLibraryClient initialMaterials={materials} canWrite={canWrite}/>} 
    {(tab === "services" || tab === "labor") && <ServiceCatalogClient key={tab} initialServices={filteredServices} canWrite={canWrite}/>} 
    {tab === "works" && <section className="mt-6"><div className="flex justify-end">{canWrite && <Link href="/settings/quote-templates/new" className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">Nouvel ouvrage</Link>}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{works.map((work) => <article key={work.id} className={`forge-surface rounded-3xl border p-5 ${work.active ? "" : "opacity-55"}`}><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{work.source === "forge" ? "Catalogue Forge" : "Mes éléments"} · {work.category || "Ouvrage"}{work.favorite ? " · Favori" : ""}</p><h2 className="mt-2 text-lg font-bold text-[var(--forge-text-primary)]">{work.name}</h2><p className="mt-1 text-sm text-[var(--forge-text-secondary)]">{work.title} · {work.lineCount} ligne{work.lineCount > 1 ? "s" : ""}</p>{work.source === "workspace" ? <Link href={`/settings/quote-templates/${work.id}/edit`} className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-[var(--forge-border-strong)] px-4 font-semibold text-blue-600">Ouvrir</Link> : canWrite && <button type="button" disabled={copying === work.id} onClick={() => void duplicateWork(work.id)} className="mt-4 min-h-11 rounded-xl border border-[var(--forge-border-strong)] px-4 font-semibold text-blue-600">{copying === work.id ? "Copie…" : "Personnaliser"}</button>}</article>)}</div>{works.length === 0 && <p className="py-12 text-center text-[var(--forge-text-secondary)]">Aucun ouvrage enregistré.</p>}</section>}
  </div>;
}
