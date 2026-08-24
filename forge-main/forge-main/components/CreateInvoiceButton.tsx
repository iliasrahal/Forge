"use client";

import { useState } from "react";


type CreateInvoiceButtonProps = {
  quoteId: string;
};



export default function CreateInvoiceButton({
  quoteId,
}: CreateInvoiceButtonProps) {


  const [loading, setLoading] =
    useState(false);



  async function handleCreateInvoice() {


    try {

      setLoading(true);


      const response =
        await fetch(
          "/api/invoices/create-from-quote",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              quoteId,
            }),
          }
        );



      const data =
        await response.json();



      if (data.invoice) {

        window.location.href =
          `/invoices/${data.invoice.id}`;

      }



    } catch (error) {

      console.error(
        "Erreur création facture :",
        error
      );

    } finally {

      setLoading(false);

    }

  }



  return (
    <button
      type="button"
      onClick={handleCreateInvoice}
      disabled={loading}
      className="w-full rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
    >

      {loading
        ? "Création..."
        : "Créer une facture"}

    </button>
  );
}