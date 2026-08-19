import Link from "next/link";
import { notFound, redirect } from "next/navigation";


import { prisma } from "@/src/lib/prisma";
import { QuoteStatus } from "@/src/generated/prisma/client";


type EditQuotePageProps = {
  params: Promise<{
    id: string;
    quoteId: string;
  }>;
};



export default async function EditQuotePage({
  params,
}: EditQuotePageProps) {
  const { id, quoteId } = await params;


  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      clientId: id,
    },
    include: {
      client: true,
    },
  });


  if (!quote) {
    notFound();
  }


  const clientName =
    quote.client.type === "PARTICULIER"
      ? `${quote.client.firstName ?? ""} ${
          quote.client.lastName ?? ""
        }`.trim()
      : quote.client.companyName ?? "Client professionnel";



  async function updateQuote(formData: FormData) {
    "use server";


    const title = formData
      .get("title")
      ?.toString()
      .trim();


    const description = formData
      .get("description")
      ?.toString()
      .trim();


    const amountValue = formData
      .get("amount")
      ?.toString()
      .replace(",", ".")
      .trim();


    const status = formData
      .get("status")
      ?.toString();



    if (!title || !description || !amountValue || !status) {
      throw new Error(
        "Tous les champs obligatoires doivent être remplis.",
      );
    }



    const allowedStatuses = [
      "BROUILLON",
      "ENVOYE",
      "ACCEPTE",
      "REFUSE",
    ];



    if (!allowedStatuses.includes(status)) {
      throw new Error("Le statut du devis est invalide.");
    }

    const quoteStatus = status as QuoteStatus;



    const amount = Number(amountValue);



    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Le montant du devis est invalide.");
    }



    const amountCents = Math.round(amount * 100);



    await prisma.quote.update({
      where: {
        id: quoteId,
      },
      data: {
        title,
        description,
        amountCents,
        status: quoteStatus,
      },
    });



    redirect(`/clients/${id}/quotes/${quoteId}`);
  }



  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8 dark:bg-slate-950">


      <div>


        <Link
          href={`/clients/${id}/quotes/${quoteId}`}
          aria-label="Retour au devis"
          className="inline-flex items-center gap-2 text-base font-medium text-slate-500 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <span className="text-xl">
            ←
          </span>

          <span>
            Retour
          </span>
        </Link>



        <p className="mt-4 text-xl font-bold text-blue-700 dark:text-blue-400">
          {clientName}
        </p>


      </div>



      <form
        action={updateQuote}
        className="mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >


        <div>


          <label
            htmlFor="title"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Titre du devis
          </label>



          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={quote.title}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
          />


        </div>



        <div>


          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Description des travaux
          </label>



          <textarea
            id="description"
            name="description"
            required
            rows={6}
            defaultValue={quote.description ?? ""}
            className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
          />


        </div>



        <div>


          <label
            htmlFor="amount"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Montant estimé
          </label>



          <div className="relative">


            <input
              id="amount"
              name="amount"
              type="number"
              required
              min="0"
              step="0.01"
              inputMode="decimal"
              defaultValue={(quote.amountCents / 100).toFixed(2)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
            />



            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-semibold text-slate-500 dark:text-slate-400">
              €
            </span>


          </div>


        </div>



        <div>


          <label
            htmlFor="status"
            className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400"
          >
            Statut
          </label>



          <select
            id="status"
            name="status"
            required
            defaultValue={quote.status}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
          >
            <option value="BROUILLON">
              Brouillon
            </option>

            <option value="ENVOYE">
              Envoyé
            </option>

            <option value="ACCEPTE">
              Accepté
            </option>

            <option value="REFUSE">
              Refusé
            </option>

          </select>


        </div>



        <div className="flex flex-col gap-3 sm:flex-row">


          <button
            type="submit"
            className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Enregistrer les modifications
          </button>



          <Link
            href={`/clients/${id}/quotes/${quoteId}`}
            className="rounded-2xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Annuler
          </Link>


        </div>


      </form>


    </main>
  );
}