"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Props = {
  initialLogoDataUrl: string | null;
};

const MAX_DIMENSION = 480;
const MAX_OUTPUT_BYTES = 480_000;

async function fileToNormalizedDataUrl(file: File): Promise<string> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Image illisible."));
    element.src = rawUrl;
  });

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.width, image.height),
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Traitement de l’image impossible.");
  ctx.drawImage(image, 0, 0, width, height);

  let output = canvas.toDataURL("image/png");
  if (output.length > MAX_OUTPUT_BYTES) {
    output = canvas.toDataURL("image/jpeg", 0.85);
  }
  if (output.length > MAX_OUTPUT_BYTES) {
    throw new Error("Ce logo est trop lourd, essaie une image plus simple.");
  }
  return output;
}

export default function LogoUploader({ initialLogoDataUrl }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState<string | null>(initialLogoDataUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(next: string | null) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/settings/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoDataUrl: next }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible d’enregistrer le logo.");
      }
      setLogo(next);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d’enregistrer le logo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const dataUrl = await fileToNormalizedDataUrl(file);
      await save(dataUrl);
    } catch (pickError) {
      setError(
        pickError instanceof Error
          ? pickError.message
          : "Traitement de l’image impossible.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        Logo de l’entreprise
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Affiché en tête de tes devis, factures et avoirs. PNG ou JPEG, fond
        transparent conseillé.
      </p>

      <div className="mt-4 flex items-center gap-4">
        <div className="grid h-20 w-40 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt="Logo"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-slate-400">Aucun logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-xl border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            {busy ? "…" : logo ? "Remplacer" : "Importer un logo"}
          </button>
          {logo ? (
            <button
              type="button"
              onClick={() => save(null)}
              disabled={busy}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300"
            >
              Retirer
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={(event) => onPick(event.target.files?.[0])}
      />

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
