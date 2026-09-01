import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";


import QuoteLinesForm from "@/components/QuoteLinesForm";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";


type NewQuotePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    title?: string;
    description?: string;
  }>;
};


export default async function NewQuotePage({
  params,
  searchParams,
}: NewQuotePageProps) {


  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("write");



  const { id } = await params;

  const {
    title,
    description,
  } = await searchParams;



  const client =
    await prisma.client.findFirst({
      where: {
        id,
        organizationId: workspaceContext.workspace.id,
      },
    });



  if (!client) {
    notFound();
  }



  const clientName =
    client.type === "PROFESSIONNEL"
      ? client.companyName
      : `${client.firstName ?? ""} ${
          client.lastName ?? ""
        }`.trim();




  async function createQuote(
    formData: FormData,
  ) {
    "use server";

    await requireCurrentUser();
    const writeContext = await requireWorkspaceContext("write");


    const ownedClient =
      await prisma.client.findFirst({
        where: {
          id,
          organizationId: writeContext.workspace.id,
        },
        select: {
          id: true,
        },
      });


    if (!ownedClient) {
      notFound();
    }


    const title =
      formData
        .get("title")
        ?.toString()
        .trim();


    const description =
      formData
        .get("description")
        ?.toString()
        .trim();


    const quoteLinesRaw =
      formData
        .get("quoteLines")
        ?.toString();



    if (
      !title ||
      !description ||
      !quoteLinesRaw
    ) {
      throw new Error(
        "Tous les champs obligatoires doivent être remplis.",
      );
    }



    const lines =
      JSON.parse(
        quoteLinesRaw,
      );



    const cleanLines =
      lines.filter(
        (line: {
          category: string;
          amount: string;
        }) =>
          line.category &&
          line.amount,
      );



    if (
      cleanLines.length === 0
    ) {
      throw new Error(
        "Ajoute au moins une ligne au devis.",
      );
    }



    const amountCents =
      Math.round(
        cleanLines.reduce(
          (
            total: number,
            line: {
              amount: string;
            },
          ) =>
            total +
            Number(
              line.amount.replace(
                ",",
                ".",
              ),
            ),
          0,
        ) * 100,
      );



    const reference =
      `DEV-${Date.now()}`;



    const quote =
      await prisma.quote.create({
        data: {
          reference,
          title,
          description,
          amountCents,
          status:
            "BROUILLON",
          clientId:
            ownedClient.id,
          organizationId: writeContext.workspace.id,

          lines: {
            create:
              cleanLines.map(
                (line: {
                  category: string;
                  amount: string;
                }) => ({
                  category:
                    line.category,

                  label:
                    line.category,

                  amountCents:
                    Math.round(
                      Number(
                        line.amount.replace(
                          ",",
                          ".",
                        ),
                      ) * 100,
                    ),
                }),
              ),
          },
        },
      });



    redirect(
      `/clients/${ownedClient.id}/quotes/${quote.id}`,
    );
  }




  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8 dark:bg-slate-950">



      <div>



        <Link
          href={`/clients/${id}`}
          aria-label="Retour au dossier client"
          className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>
            Retour
          </span>


        </Link>




        <p className="mt-4 text-xl font-bold text-blue-700 dark:text-blue-400">
          {clientName ||
            "Client sans nom"}
        </p>



      </div>





      <form
        action={createQuote}
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
            defaultValue={
              title ?? ""
            }
            placeholder="Exemple : Remplacement chauffe-eau"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
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
            defaultValue={
              description ?? ""
            }
            placeholder="Décris simplement les travaux prévus..."
            className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />



        </div>





        <QuoteLinesForm />






        <div className="flex flex-col gap-3 sm:flex-row">



          <button
            type="submit"
            className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Enregistrer le devis
          </button>




          <Link
            href={`/clients/${id}`}
            className="rounded-2xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Annuler
          </Link>



        </div>




      </form>




    </main>
  );
}
