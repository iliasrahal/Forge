"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  isValidClientEmail,
  normalizeClientEmail,
} from "@/src/lib/client-email";

type DownloadQuotePdfProps = {
  clientId?: string | null;
  clientEmail?: string | null;
  quoteId?: string;
  quoteEditUrl?: string;
};

export default function DownloadQuotePdf({
  clientId,
  clientEmail,
  quoteId,
  quoteEditUrl,
}: DownloadQuotePdfProps) {

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const initialClientEmail = isValidClientEmail(clientEmail)
    ? normalizeClientEmail(clientEmail)
    : "";
  const [missingEmail, setMissingEmail] = useState(Boolean(clientId) && !initialClientEmail);
  const [missingClient, setMissingClient] = useState(false);
  const [email, setEmail] = useState(initialClientEmail);
  const [recipientEmail, setRecipientEmail] = useState(initialClientEmail);


  async function handleSendQuote(explicitEmail?: string) {

    try {

      setLoading(true);
      setMessage("");
      setMissingClient(false);


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
              ...(explicitEmail ? { email: explicitEmail } : {}),
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

        if (data.error === "email_invalid") {
          setMessage("Saisis une adresse e-mail valide.");
          setMissingEmail(true);
          return;
        }

        if (data.error === "client_missing") {
          setMessage(
            data.message ?? "Associez un client au devis avant de l’envoyer.",
          );
          setMissingClient(true);
          return;
        }


        setMessage("Impossible d’envoyer le devis pour le moment. Réessayez.");

        return;

      }



      setMessage(
        "✅ Devis envoyé avec succès.",
      );
      if (explicitEmail) {
        setRecipientEmail(explicitEmail);
        setEmail(explicitEmail);
      }
      setMissingEmail(false);

      router.refresh();


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

  function handleEmailSend() {
    const cleanEmail = normalizeClientEmail(email);
    if (!isValidClientEmail(cleanEmail)) {
      setMessage("Saisis une adresse e-mail valide.");
      return;
    }
    void handleSendQuote(cleanEmail);
  }



  return (
    <div className="space-y-3">


      {!missingEmail && <button
        type="button"
        onClick={() => void handleSendQuote()}
        disabled={loading}
        className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950"
      >

        {loading
          ? "Envoi en cours..."
          : "Envoyer le devis"}

      </button>}

      {!missingEmail && recipientEmail ? (
        <p className="text-center text-sm text-slate-600 dark:text-slate-300">
          Envoyer à : <span className="font-semibold text-blue-700 dark:text-blue-400">{recipientEmail}</span>
        </p>
      ) : null}



      {message && (

        <div
          className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-5 text-center text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >

          <p className="font-medium">
            {message}
          </p>



          {missingClient && quoteEditUrl && (
            <button
              type="button"
              onClick={() => router.push(quoteEditUrl)}
              className="mt-4 rounded-xl bg-blue-600 px-7 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
            >
              Associer un client
            </button>
          )}

        </div>

      )}

      {missingEmail && clientId ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-left dark:border-blue-900 dark:bg-blue-950">
          <label
            htmlFor="quote-client-email"
            className="block text-sm font-semibold text-blue-700 dark:text-blue-300"
          >
            Adresse e-mail du client
          </label>
          <input
            id="quote-client-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="client@exemple.fr"
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-blue-800 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleEmailSend}
            disabled={loading}
            className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Envoi en cours..." : "Envoyer le devis"}
          </button>
        </div>
      ) : null}

    </div>
  );
}
