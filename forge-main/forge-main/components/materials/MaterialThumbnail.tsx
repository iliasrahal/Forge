"use client";

import { Package } from "lucide-react";
import { useState } from "react";

import type { MaterialImageView } from "@/src/lib/material-images";

function ThumbnailContent({ image, name }: { image?: MaterialImageView | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (image && !failed) return (
    // L'URL interne Forge contrôle l'accès puis redirige vers une URL signée courte.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image.url} alt={image.alt || name} width={image.width} height={image.height} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={`h-full w-full object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} />
  );
  return <span className="flex flex-col items-center gap-1 px-2 text-center text-[var(--forge-text-muted)]"><Package size={24} aria-hidden="true" /><span className="text-[9px] font-semibold leading-tight">Photo indisponible</span></span>;
}

export default function MaterialThumbnail({ image, name, className = "h-20 w-20" }: { image?: MaterialImageView | null; name: string; className?: string }) {
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface-hover)] ${className}`}>
      <ThumbnailContent key={image?.url || "placeholder"} image={image} name={name} />
    </span>
  );
}
