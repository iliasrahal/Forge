"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DownloadQuotePdfProps = {
  pdfUrl: string;
  clientId: string;
  fileName: string;
  quoteId?: string;
};

export default function DownloadQuotePdf({
  pdfUrl,
  clientId,
  fileName,
  quoteId,
}: DownloadQuotePdfProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/quotes/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoteId,
          }),
        },
      );


      const data = await response.json();


      console.log(
        "REPONSE ENVOI DEVIS :",
        data,
      );


    } catch (error) {

      console.error(
        "Erreur envoi devis :",
        error,
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950"
    >
      {loading
        ? "Envoi en cours..."
        : "Envoyer le devis"}
    </button>
  );
}