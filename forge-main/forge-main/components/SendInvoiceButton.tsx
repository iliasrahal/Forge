"use client";

import { useState } from "react";

type SendInvoiceButtonProps = {
  invoiceId: string;
  clientId: string;
};


export default function SendInvoiceButton({
  invoiceId,
  clientId,
}: SendInvoiceButtonProps) {

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [missingEmail, setMissingEmail] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [savingEmail, setSavingEmail] =
    useState(false);



  async function handleSendInvoice() {

    try {

      setLoading(true);
      setMessage("");
      setMissingEmail(false);



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
          "Erreur lors de l'envoi de la facture.",
        );

        return;

      }



      setMessage(
        "✅ Facture envoyée avec succès.",
      );



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

  async function handleSaveEmail() {
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
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
      setMessage("");
      await handleSendInvoice();
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


      <button
        type="button"
        onClick={handleSendInvoice}
        disabled={loading}
        className="block w-full rounded-2xl border border-blue-600 px-5 py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950"
      >

        {loading
          ? "Envoi en cours..."
          : "Envoyer la facture"}

      </button>



      {message && (

        <div
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >

          <p>
            {message}
          </p>



          {missingEmail && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-left dark:border-blue-900 dark:bg-blue-950">
              <label
                htmlFor="invoice-client-email"
                className="block text-sm font-semibold text-blue-700 dark:text-blue-300"
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

      )}


    </div>

  );

}