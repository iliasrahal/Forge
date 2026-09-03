"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  isValidClientEmail,
  normalizeClientEmail,
} from "@/src/lib/client-email";

type SendInvoiceButtonProps = {
  invoiceId: string;
  clientId: string;
  clientEmail: string | null;
};


export default function SendInvoiceButton({
  invoiceId,
  clientId,
  clientEmail,
}: SendInvoiceButtonProps) {

  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [missingEmail, setMissingEmail] =
    useState(!clientEmail);

  const [email, setEmail] =
    useState(clientEmail ?? "");

  const [recipientEmail, setRecipientEmail] =
    useState(clientEmail);

  const [savingEmail, setSavingEmail] =
    useState(false);

  const [sentSuccessfully, setSentSuccessfully] =
    useState(false);



  async function handleSendInvoice(explicitEmail?: string) {

    try {

      setLoading(true);
      setMessage("");
      setMissingEmail(false);
      setSentSuccessfully(false);



      const response =
        await fetch(
          "/api/invoices/send",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              invoiceId,
              ...(explicitEmail
                ? { email: explicitEmail }
                : {}),
            }),

          },
        );



      const data =
        await response.json();



      if (!response.ok || data.success !== true) {


        if (
          data.error === "email_missing"
        ) {

          setMessage(
            "⚠️ Ce client n'a pas encore d'adresse email.",
          );

          setMissingEmail(true);
          setRecipientEmail(null);

          return;

        }


        setMessage(
          data.error ??
          "Erreur lors de l'envoi de la facture.",
        );

        return;

      }



      setMessage(
        "✅ Facture envoyée avec succès.",
      );

      setSentSuccessfully(true);



    } catch (error) {

      console.error(
        "Erreur envoi facture :",
        error,
      );


      setMessage(
        "❌ Une erreur est survenue.",
      );


    } finally {

      setLoading(false);

    }

  }

  function handleFinish() {
    router.push("/app");
    router.refresh();
  }

  async function handleSaveEmail() {
    const cleanEmail = normalizeClientEmail(email);

    if (!isValidClientEmail(cleanEmail)) {
      setMessage("Saisis une adresse email valide.");
      return;
    }

    setSavingEmail(true);
    setMessage("");

    try {
      const saveResponse = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(
          saveData.error || "Impossible d’enregistrer l’email.",
        );
      }

      setMissingEmail(false);
      setEmail(cleanEmail);
      setRecipientEmail(cleanEmail);
      setMessage("");
      await handleSendInvoice(cleanEmail);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer l’email.",
      );
    } finally {
      setSavingEmail(false);
    }
  }



  return (

    <div className="space-y-3">


      {!missingEmail && (
        <>
          {recipientEmail && (
            <p className="text-center text-sm text-slate-600 dark:text-slate-300">
              Envoyer à :{" "}
              <span className="font-semibold text-blue-700 dark:text-blue-400">
                {recipientEmail}
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleSendInvoice()}
            disabled={loading}
            className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            {loading ? "Envoi en cours..." : "Envoyer la facture"}
          </button>
        </>
      )}



      {message && (

        <div
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >

          <p>
            {message}
          </p>

          {sentSuccessfully && (
            <button
              type="button"
              onClick={handleFinish}
              className="mt-3 min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              Terminé
            </button>
          )}
        </div>

      )}

      {missingEmail && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-left dark:border-blue-900 dark:bg-blue-950">
          {!message && (
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Ce client n&apos;a pas encore d&apos;adresse email valide.
            </p>
          )}
          <label
            htmlFor="invoice-client-email"
            className="mt-3 block text-sm font-semibold text-blue-700 dark:text-blue-300"
          >
            Adresse email du client
          </label>
          <input
            id="invoice-client-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="client@exemple.fr"
            className="mt-2 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-blue-800 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => void handleSaveEmail()}
            disabled={savingEmail}
            className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingEmail ? "Enregistrement..." : "Enregistrer et envoyer"}
          </button>
        </div>
      )}


    </div>

  );

}
