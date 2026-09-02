"use client";

import { CheckCircle2, Eraser } from "lucide-react";
import { PointerEvent, useEffect, useRef, useState } from "react";

import type { DrawnSignature, SignaturePoint } from "@/src/lib/quote-signature";

type SignedDetails = { signerFirstName: string; signerLastName: string; signedAt: string | Date };
type Props = {
  token: string;
  initialAccepted: boolean;
  initialSignature: SignedDetails | null;
  canAccept: boolean;
  unavailableReason: string | null;
};

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

function SignatureCanvas({ onChange }: { onChange: (signature: DrawnSignature | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<SignaturePoint[][]>([]);
  const activeStrokeRef = useRef<SignaturePoint[] | null>(null);

  function drawSegment(from: SignaturePoint, to: SignaturePoint) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.strokeStyle = getComputedStyle(canvas).color;
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(from[0] * canvas.width, from[1] * canvas.height);
    context.lineTo(to[0] * canvas.width, to[1] * canvas.height);
    context.stroke();
  }

  function pointFromEvent(event: PointerEvent<HTMLCanvasElement>): SignaturePoint {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    ];
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    const stroke = [point];
    strokesRef.current.push(stroke);
    activeStrokeRef.current = stroke;
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const previous = stroke.at(-1)!;
    stroke.push(point);
    drawSegment(previous, point);
  }

  function end(event: PointerEvent<HTMLCanvasElement>) {
    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    event.preventDefault();
    activeStrokeRef.current = null;
    if (stroke.length < 2) {
      strokesRef.current = strokesRef.current.filter((candidate) => candidate !== stroke);
    }
    onChange({ version: 1, strokes: strokesRef.current.map((stroke) => [...stroke]) });
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
    activeStrokeRef.current = null;
    onChange(null);
  }

  useEffect(() => () => { activeStrokeRef.current = null; }, []);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-[var(--forge-border)] bg-white/90 shadow-inner dark:bg-white/95">
        <canvas
          ref={canvasRef}
          width={900}
          height={300}
          aria-label="Zone de signature manuscrite"
          className="block h-44 w-full touch-none cursor-crosshair text-slate-900 sm:h-48"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
      </div>
      <button type="button" onClick={clear} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--forge-accent-blue-lit)]">
        <Eraser size={16} /> Effacer
      </button>
    </div>
  );
}

export default function PublicQuoteAcceptance({ token, initialAccepted, initialSignature, canAccept, unavailableReason }: Props) {
  const [open, setOpen] = useState(false);
  const [signed, setSigned] = useState<SignedDetails | null>(initialSignature);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [signature, setSignature] = useState<DrawnSignature | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (loading || signed) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/public/quotes/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, firstName, lastName, confirmed, signature }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Votre signature n’a pas pu être enregistrée.");
      setSigned({ signerFirstName: data.signerFirstName, signerLastName: data.signerLastName, signedAt: data.signedAt });
      setOpen(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Votre signature n’a pas pu être enregistrée.");
    } finally {
      setLoading(false);
    }
  }

  if (signed) {
    return (
      <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
        <CheckCircle2 className="mx-auto text-emerald-500" size={30} />
        <h2 className="mt-3 text-xl font-bold text-[var(--forge-text-primary)]">Devis accepté et signé</h2>
        <p className="mt-2 text-sm text-[var(--forge-text-secondary)]">Votre signature a bien été enregistrée.</p>
        <p className="mt-3 text-sm font-semibold text-[var(--forge-text-primary)]">
          Signé par {signed.signerFirstName} {signed.signerLastName}<br />
          le {formatDateTime(signed.signedAt)}
        </p>
      </div>
    );
  }

  if (initialAccepted) {
    return <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center text-sm font-medium text-[var(--forge-text-primary)]">Ce devis a déjà été accepté.</p>;
  }
  if (!canAccept) {
    return <p className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-center text-sm font-medium text-[var(--forge-text-primary)]">{unavailableReason || "Ce devis ne peut pas être accepté."}</p>;
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-6 text-base font-bold text-white shadow-lg shadow-blue-950/20 transition hover:brightness-105">
        Accepter et signer
      </button>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--forge-border)] bg-[var(--forge-surface-secondary)] p-4 sm:p-5">
      <h2 className="text-center text-xl font-bold text-[var(--forge-text-primary)]">Accepter et signer</h2>
      <p className="mt-2 text-center text-sm text-[var(--forge-text-secondary)]">Renseignez votre identité puis signez dans la zone prévue.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[var(--forge-text-primary)]">Prénom
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" maxLength={100} className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-input-background)] px-4 text-base outline-none focus:border-blue-500" />
        </label>
        <label className="text-sm font-semibold text-[var(--forge-text-primary)]">Nom
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" maxLength={100} className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-input-background)] px-4 text-base outline-none focus:border-blue-500" />
        </label>
      </div>
      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-[var(--forge-text-primary)]">Votre signature</p>
        <SignatureCanvas onChange={setSignature} />
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6 text-[var(--forge-text-secondary)]">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-blue-600" />
        <span>Je confirme avoir pris connaissance de ce devis et l’accepter.</span>
      </label>
      {error ? <p className="mt-3 text-center text-sm font-medium text-red-500">{error}</p> : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setOpen(false)} disabled={loading} className="min-h-12 rounded-2xl border border-[var(--forge-border)] px-5 font-semibold text-[var(--forge-text-primary)]">Annuler</button>
        <button type="button" onClick={submit} disabled={loading} className="min-h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Enregistrement…" : "Confirmer la signature"}</button>
      </div>
    </section>
  );
}
