"use client";

import { useState } from "react";

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

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);


  async function handleDownload() {

    try {

      setLoading(true);
      setSuccess(false);
      setError(false);


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


      const data =
        await response.json();


      console.log(
        "REPONSE ENVOI DEVIS :",
        data,
      );


      if (!response.ok) {
        throw new Error(
          data.error ??
          "Erreur lors de l'envoi du devis",
        );
      }


      setSuccess(true);


      setTimeout(() => {
        setSuccess(false);
      }, 3000);


    } catch (error) {

      console.error(
        "Erreur envoi devis :",
        error,
      );

      setError(true);


      setTimeout(() => {
        setError(false);
      }, 3000);


    } finally {

      setLoading(false);

    }
  }


  return (
    <div className="space-y-3">

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


      {success && (
        <p className="text-center text-sm font-medium text-green-600">
          Devis envoyé
        </p>
      )}


      {error && (
        <p className="text-center text-sm font-medium text-red-600">
          ❌ Erreur lors de l'envoi
        </p>
      )}

    </div>
  );
}