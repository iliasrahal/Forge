import Link from "next/link";
import { redirect } from "next/navigation";

import ClientForm from "@/components/clients/ClientForm";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

async function createClient(formData: FormData) {
  "use server";

  const currentUser =
    await requireCurrentUser();

  const rawType = String(
    formData.get("type") ?? "",
  );

  if (
    rawType !== "PARTICULIER" &&
    rawType !== "PROFESSIONNEL"
  ) {
    throw new Error(
      "Le type de client est invalide.",
    );
  }

  const type = rawType;

  const firstName = String(
    formData.get("firstName") ?? "",
  ).trim();

  const lastName = String(
    formData.get("lastName") ?? "",
  ).trim();

  const companyName = String(
    formData.get("companyName") ?? "",
  ).trim();

  const phone = String(
    formData.get("phone") ?? "",
  ).trim();

  const email = String(
    formData.get("email") ?? "",
  ).trim();

  const street = String(
    formData.get("street") ?? "",
  ).trim();

  const postalCode = String(
    formData.get("postalCode") ?? "",
  ).trim();

  const city = String(
    formData.get("city") ?? "",
  ).trim();


  if (
    type === "PARTICULIER" &&
    (!firstName || !lastName)
  ) {
    throw new Error(
      "Le prénom et le nom sont obligatoires.",
    );
  }


  if (
    type === "PROFESSIONNEL" &&
    !companyName
  ) {
    throw new Error(
      "Le nom de l’entreprise est obligatoire.",
    );
  }


  const client =
    await prisma.client.create({
      data: {
        type,

        firstName:
          type === "PARTICULIER"
            ? firstName || null
            : null,

        lastName:
          type === "PARTICULIER"
            ? lastName || null
            : null,

        companyName:
          type === "PROFESSIONNEL"
            ? companyName || null
            : null,

        phone: phone || null,
        email: email || null,
        street: street || null,
        postalCode: postalCode || null,
        city: city || null,

        userId: currentUser.id,
      },
    });


  redirect(`/clients/${client.id}`);
}


export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    phone?: string;
    email?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    notes?: string;
  }>;
}) {
  await requireCurrentUser();

  const params = await searchParams;


  const initialClient = {
    name: params.name ?? "",
    phone: params.phone ?? "",
    email: params.email ?? "",
    street: params.street ?? "",
    postalCode: params.postalCode ?? "",
    city: params.city ?? "",
    notes: params.notes ?? "",
  };


  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-6 text-slate-950 dark:text-white">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

        <div className="flex items-center">
          <Link
            href="/clients"
            aria-label="Retour à la liste des clients"
            className="forge-back-link text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <span className="text-sm font-semibold">
              Retour
            </span>
          </Link>
        </div>


        <ClientForm
          onSubmit={createClient}
          initialValues={initialClient}
        />


      </section>
    </main>
  );
}
