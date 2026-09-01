"use client";

import { useState } from "react";
import {
  Camera,
  LoaderCircle,
  Mic,
  Send,
} from "lucide-react";

type InterventionReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};

type ChatBarProps = {
  onStartProcessing: () => void;
  onReportGenerated: (
    report: InterventionReport,
  ) => void;
  onError: (message: string) => void;
};

export default function ChatBar({
  onStartProcessing,
  onReportGenerated,
  onError,
}: ChatBarProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    const intervention = message.trim();

    if (!intervention || isLoading) {
      return;
    }

    setIsLoading(true);
    onError("");
    onStartProcessing();

    try {
      const response = await fetch(
        "/api/interventions/report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intervention,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible de créer le compte rendu.",
        );
      }

      onReportGenerated({
        intervention:
          data.intervention || "Non précisé",
        diagnostic:
          data.diagnostic || "Non précisé",
        travaux: data.travaux || "Non précisé",
        recommandation:
          data.recommandation ||
          "Aucune recommandation particulière.",
      });

      setMessage("");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.";

      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div className="mt-12 w-full">
      <div className="forge-bar flex min-h-24 w-full items-center gap-3 rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-lg shadow-slate-200/60">
        <input
          type="text"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Parle ou écris..."
          aria-label="Écrire à Forge"
          className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-slate-400 disabled:text-slate-400"
        />

        <button
          type="button"
          aria-label="Ajouter une photo"
          title="Ajouter une photo"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
        >
          <Camera size={27} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          aria-label="Parler à Forge"
          title="Parler à Forge"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-blue-600 bg-white text-blue-600 transition hover:bg-blue-50"
        >
          <Mic size={27} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!message.trim() || isLoading}
          aria-label="Envoyer à Forge"
          title="Envoyer"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isLoading ? (
            <LoaderCircle
              size={27}
              strokeWidth={2.2}
              className="animate-spin"
            />
          ) : (
            <Send size={25} strokeWidth={2.2} />
          )}
        </button>
      </div>
    </div>
  );
}
