import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";
import { clientService } from "@/src/services/client.service";

type NewInterventionPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    title?: string;
    description?: string;
  }>;
};

export default async function NewInterventionPage({
  params,
  searchParams,
}: NewInterventionPageProps) {

  const { id } = await params;

  const { title, description } =
    await searchParams;

  const currentUser =
    await requireCurrentUser();


  const client =
    await clientService.getById(
      id,
      currentUser.id,
    );


  if (!client) {
    notFound();
  }


  const name =
    client.type === "PARTICULIER"
      ? `${client.firstName ?? ""} ${
          client.lastName ?? ""
        }`.trim()
      : client.companyName ??
        "Client professionnel";



  async function createIntervention(
    formData: FormData,
  ) {

    "use server";


    const date =
      formData.get("date");

    const time =
      formData.get("time");

    const formTitle =
      formData.get("title");

    const formDescription =
      formData.get("description");



    if (
      typeof date !== "string" ||
      typeof time !== "string" ||
      typeof formTitle !== "string" ||
      typeof formDescription !== "string"
    ) {
      throw new Error(
        "Les informations du formulaire sont invalides.",
      );
    }



    const cleanTitle =
      formTitle.trim();


    const cleanDescription =
      formDescription.trim();



    if (!date || !time || !cleanTitle) {
      throw new Error(
        "La date, l’heure et le motif doivent être remplis.",
      );
    }



    // Normalisation de l'heure
    let cleanTime =
      time.trim();


    // Exemple : 9 => 09:00
    if (/^\d{1,2}$/.test(cleanTime)) {
      cleanTime =
        `${cleanTime.padStart(2, "0")}:00`;
    }


    // Exemple : 930 => 09:30
    if (/^\d{3,4}$/.test(cleanTime)) {

      const formatted =
        cleanTime.padStart(4, "0");

      cleanTime =
        `${formatted.slice(0, 2)}:${formatted.slice(2)}`;
    }


    // Exemple : 14h30 => 14:30
    cleanTime =
      cleanTime.replace("h", ":");



    const scheduledAt =
      new Date(
        `${date}T${cleanTime}:00`,
      );



    if (
      Number.isNaN(
        scheduledAt.getTime(),
      )
    ) {
      throw new Error(
        "La date ou l’heure est invalide.",
      );
    }



    const intervention =
      await prisma.intervention.create({
        data: {
          userId: currentUser.id,
          title: cleanTitle,
          description:
            cleanDescription || null,
          scheduledAt,
          clientId: id,
        },
      });



    redirect(
      `/app?newIntervention=${intervention.id}`,
    );

  }



  return (

    <main className="mx-auto w-full max-w-3xl px-6 py-6 dark:bg-slate-950">

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">


        <Link
          href={`/clients/${client.id}`}
          aria-label="Retour au dossier client"
          className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>
            Retour
          </span>

        </Link>



        <p className="mt-4 text-xl font-bold text-blue-700 dark:text-blue-400">
          {name}
        </p>




        <form
          action={createIntervention}
          className="mt-6 space-y-5"
        >



          <div>

            <label
              htmlFor="date"
              className="mb-2 block font-semibold text-blue-700 dark:text-blue-400"
            >
              Date
            </label>

            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

          </div>




          <div>

            <label
              htmlFor="time"
              className="mb-2 block font-semibold text-blue-700 dark:text-blue-400"
            >
              Heure
            </label>


            <input
              id="time"
              name="time"
              type="time"
              step={60}
              required
              defaultValue="09:00"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

          </div>




          <div>

            <label
              htmlFor="title"
              className="mb-2 block font-semibold text-blue-700 dark:text-blue-400"
            >
              Motif / titre de l’intervention
            </label>


            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={
                title ?? ""
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

          </div>

          <input
            type="hidden"
            name="description"
            value={description ?? ""}
          />




          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Créer l’intervention
          </button>


        </form>


      </section>


    </main>

  );
}
