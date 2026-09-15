"use client";

import { Camera, ImagePlus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { EffectiveMaterial } from "@/src/lib/material-catalog";
import { getMaterialAnalysisFollowUp } from "@/src/lib/material-analysis";
import type { MaterialIdentification } from "@/src/lib/material-matching";
import { compressPhoto } from "@/src/lib/photo-compression";
import { createMaterialLineSnapshot } from "@/src/lib/quote-lines";
import type { QuoteMaterialSnapshotSource } from "@/src/lib/quote-lines";
import { serializeQuoteLines } from "@/src/lib/quote-catalog-matching";
import MaterialPicker from "@/components/materials/MaterialPicker";

type Result = {
  analysisId: string;
  status: "NEEDS_INPUT" | "COMPLETED";
  identification: MaterialIdentification;
  matches: Array<{ material: EffectiveMaterial; score: number; reasons: string[] }>;
  error?: string;
};

export default function QuotePhotoStarter() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"idle" | "photo">("idle");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  async function addPhotos(files: FileList | null, analyzeAfterAdd = false) {
    if (!files) return;
    setError("");
    const remaining = Math.max(0, 4 - photos.length);
    try {
      const compressed = await Promise.all(Array.from(files).slice(0, remaining).map(compressPhoto));
      const nextPhotos = [...photos, ...compressed];
      setPhotos(nextPhotos);
      setPreviews((current) => [...current, ...compressed.map((file) => URL.createObjectURL(file))]);
      if (analyzeAfterAdd && compressed.length) await analyze(nextPhotos);
    } catch {
      setError("Cette photo ne peut pas être convertie. Choisis une photo JPEG, PNG, WebP ou reprends-la avec l’appareil photo.");
    }
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index]);
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
    setPreviews((current) => current.filter((_, photoIndex) => photoIndex !== index));
  }

  async function analyze(photosToAnalyze = photos) {
    if (!photosToAnalyze.length || loading) return;
    setLoading(true); setError(""); setResult(null);
    const data = new FormData();
    photosToAnalyze.forEach((photo) => data.append("photos", photo));
    if (notes.trim()) data.set("notes", notes.trim());
    const response = await fetch("/api/photos/materials", { method: "POST", body: data });
    const payload = await response.json().catch(() => ({})) as Result;
    setLoading(false);
    if (!response.ok) { setError(payload.error || "Impossible d’analyser ces photos."); return; }
    setResult(payload);
  }

  function chooseMaterial(material: QuoteMaterialSnapshotSource) {
    const line = createMaterialLineSnapshot(material);
    const params = new URLSearchParams({ title: result?.identification.equipmentType ? `Remplacement ${result.identification.equipmentType}` : material.name, quoteLines: serializeQuoteLines([line]) });
    router.push(`/quotes/new?${params.toString()}`);
  }

  const followUp = result ? getMaterialAnalysisFollowUp(result.identification, photos.length) : null;

  if (mode === "idle") {
    return (
      <section className="mb-4" aria-label="Analyse photo du matériel">
        <button type="button" onClick={() => setMode("photo")} className="forge-surface flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-center font-semibold text-[var(--forge-text-primary)] hover:border-blue-400 sm:w-auto sm:justify-start"><Camera className="text-pink-500" />Prendre une photo</button>
      </section>
    );
  }

  return (
    <section className="forge-surface mb-6 rounded-3xl border p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-[var(--forge-text-primary)]">Créer depuis des photos</h2><p className="mt-1 text-sm text-[var(--forge-text-muted)]">Forge analyse, puis tu valides toujours la référence.</p></div><button type="button" onClick={() => setMode("idle")} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-[var(--forge-surface-hover)]" aria-label="Fermer"><X size={19} /></button></div>
      <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={(event) => { void addPhotos(event.target.files, Boolean(result)); event.currentTarget.value = ""; }} />
      <input ref={galleryRef} hidden type="file" accept="image/*" multiple onChange={(event) => { void addPhotos(event.target.files, Boolean(result)); event.currentTarget.value = ""; }} />
      {!result ? <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => cameraRef.current?.click()} className="min-h-12 rounded-xl bg-blue-600 px-3 font-semibold text-white"><Camera className="mr-2 inline" size={18} />Appareil photo</button><button type="button" onClick={() => galleryRef.current?.click()} className="min-h-12 rounded-xl border border-[var(--forge-border-strong)] px-3 font-semibold text-[var(--forge-text-primary)]"><ImagePlus className="mr-2 inline" size={18} />Galerie</button></div> : null}
      {/* Les aperçus sont des URL blob locales et éphémères : next/image ne peut pas les optimiser. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {previews.length ? <div className="mt-3 flex gap-2 overflow-x-auto">{previews.map((preview, index) => <div key={preview} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl"><img src={preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => removePhoto(index)} aria-label={`Retirer la photo ${index + 1}`} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-slate-950/70 text-white"><X size={14} /></button></div>)}</div> : null}
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Contexte facultatif : type d’installation, besoin…" className="mt-3 w-full resize-none rounded-xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] p-3 text-[var(--forge-text-primary)]" />
      <button type="button" disabled={!photos.length || loading} onClick={() => void analyze()} className="mt-3 min-h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-pink-500 px-4 font-semibold text-white disabled:opacity-50"><Sparkles className={`mr-2 inline ${loading ? "animate-spin" : ""}`} size={18} />{loading ? "Analyse en cours…" : "Analyser le matériel"}</button>
      {error ? <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      {result ? <div className="mt-5 space-y-4"><div className="rounded-2xl bg-[var(--forge-surface-secondary)] p-4"><p className="text-sm font-semibold text-[var(--forge-text-muted)]">Forge a identifié</p><p className="mt-1 text-xl font-bold capitalize text-[var(--forge-text-primary)]">{result.identification.equipmentType || "Matériel à confirmer"}</p><p className="mt-1 text-sm text-[var(--forge-text-muted)]">Confiance {result.identification.confidence === "high" ? "élevée" : result.identification.confidence === "medium" ? "moyenne" : "faible"}. {[result.identification.brand, result.identification.reference].filter(Boolean).join(" · ")}</p></div>
        {result.identification.visibleCharacteristics.length ? <div><h3 className="font-semibold text-[var(--forge-text-primary)]">Caractéristiques utiles</h3><p className="mt-1 text-sm text-[var(--forge-text-secondary)]">{result.identification.visibleCharacteristics.slice(0, 4).map((item) => `${item.name} : ${item.value}`).join(" · ")}</p></div> : null}
        {!followUp?.requestPhoto && result.identification.uncertainCharacteristics.length ? <div className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"><strong>À confirmer :</strong> {result.identification.uncertainCharacteristics.slice(0, 2).map((item) => `${item.name} (${item.possibleValue})`).join(" · ")}</div> : null}
        {followUp?.requestPhoto ? <div className="rounded-2xl border border-blue-400/40 bg-blue-500/10 p-4"><h3 className="font-semibold text-[var(--forge-text-primary)]">Pour aller plus loin</h3><p className="mt-1 text-sm text-[var(--forge-text-secondary)]">{followUp.photoPrompt}</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={loading} onClick={() => cameraRef.current?.click()} className="min-h-12 rounded-xl bg-blue-600 px-3 font-semibold text-white disabled:opacity-50"><Camera className="mr-2 inline" size={18} />Prendre une photo</button><button type="button" disabled={loading} onClick={() => galleryRef.current?.click()} className="min-h-12 rounded-xl border border-[var(--forge-border-strong)] px-3 font-semibold text-[var(--forge-text-primary)] disabled:opacity-50"><ImagePlus className="mr-2 inline" size={18} />Galerie</button></div><p className="mt-2 text-xs text-[var(--forge-text-muted)]">La nouvelle photo sera analysée avec les précédentes.</p></div> : null}
        {followUp?.questions.length ? <div><h3 className="font-semibold text-[var(--forge-text-primary)]">Forge a besoin d’une précision</h3><ul className="mt-1 space-y-2 text-sm text-[var(--forge-text-secondary)]">{followUp.questions.map((question) => <li key={question} className="rounded-xl bg-[var(--forge-surface-secondary)] p-3">{question}</li>)}</ul><p className="mt-2 text-sm text-[var(--forge-text-muted)]">Précise la réponse dans le contexte, puis relance l’analyse.</p></div> : null}
        {!followUp?.requestPhoto ? <div><h3 className="font-semibold text-[var(--forge-text-primary)]">Matériels proposés</h3>{result.matches.length ? <div className="mt-2 space-y-2">{result.matches.map(({ material, reasons }) => <button key={material.id} type="button" onClick={() => chooseMaterial(material)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4 text-left hover:border-blue-400"><span><span className="block font-semibold text-[var(--forge-text-primary)]">{material.name}</span><span className="block text-sm text-[var(--forge-text-muted)]">{[material.brand, material.reference].filter(Boolean).join(" · ")} · {reasons.slice(0, 2).join(", ")}</span></span><span className="shrink-0 font-bold text-blue-600">Choisir</span></button>)}</div> : <p className="mt-2 rounded-xl bg-[var(--forge-surface-secondary)] p-3 text-sm text-[var(--forge-text-muted)]">Aucun matériel correspondant dans votre bibliothèque.</p>}<button type="button" onClick={() => setShowPicker(true)} className="mt-3 min-h-11 w-full rounded-xl border border-[var(--forge-border-strong)] font-semibold text-[var(--forge-text-primary)]">Rechercher manuellement</button></div> : null}
      </div> : null}
      <MaterialPicker open={showPicker} onClose={() => setShowPicker(false)} onSelect={chooseMaterial} />
    </section>
  );
}
