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
  clientId,
  quoteId,
}: DownloadQuotePdfProps) {

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [missingEmail, setMissingEmail] = useState(false);


  async function handleSendQuote() {

    try {

      setLoading(true);
      setMessage("");
      setMissingEmail(false);


      const response =
        await fetch(
          "/api/quotes/send",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              quoteId,
            }),
          },
        );


      const data =
        await response.json();



      if (!response.ok) {


        if (
          data.error === "email_missing"
        ) {

          setMessage(
            "⚠️ Ce client n'a pas encore d'adresse email.",
          );

          setMissingEmail(true);

          return;

        }


        setMessage(
          data.error ??
          "Erreur lors de l'envoi du devis.",
        );

        return;

      }



      setMessage(
        "✅ Devis envoyé avec succès.",
      );


    } catch (error) {

      console.error(
        "Erreur envoi devis :",
        error,
      );


      setMessage(
        "❌ Une erreur est survenue.",
      );


    } finally {

      setLoading(false);

    }

  }



  return (
    <div className="space-y-3">

      <button
        type="button"
        onClick={handleSendQuote}
        disabled={loading}
        className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950"
      >

        {loading
          ? "Envoi en cours..."
          : "Envoyer le devis"}

      </button>



      {message && (

        <div
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >

          <p>
            {message}
          </p>


          {missingEmail && (

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/clients/${clientId}/edit`,
                )
              }
              className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Ajouter un email
            </button>

          )}

        </div>

      )}

    </div>
  );
}