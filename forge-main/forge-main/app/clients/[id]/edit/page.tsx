import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import ClientForm from "@/components/clients/ClientForm";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

type EditClientPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditClientPage({
  params,
}: EditClientPageProps) {
  const { id } = await params;
  const workspaceContext = await requireWorkspaceContext("write");

  const client = await prisma.client.findFirst({
    where: {
      id,
      organizationId: workspaceContext.workspace.id,
    },
  });

  if (!client) {
    notFound();
  }

  async function updateClient(formData: FormData) {
    "use server";

    const writeContext = await requireWorkspaceContext("write");

    const rawType = String(formData.get("type") ?? "");

    if (
      rawType !== "PARTICULIER" &&
      rawType !== "PROFESSIONNEL"
    ) {
      throw new Error("Le type de client est invalide.");
    }

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


    // Les coordonnées sont optionnelles.
    // Forge accepte un client même sans téléphone ou adresse.


    if (
      rawType === "PARTICULIER" &&
      !firstName
    ) {
      throw new Error(
        "Le prénom est obligatoire.",
      );
    }

    if (
      rawType === "PROFESSIONNEL" &&
      !companyName
    ) {
      throw new Error(
        "Le nom de l’entreprise est obligatoire.",
      );
    }

    const updated = await prisma.client.updateMany({
      where: {
        id,
        organizationId: writeContext.workspace.id,
      },
      data: {
        type: rawType,

        firstName: firstName || null,
        lastName: lastName || null,

        companyName:
          rawType === "PROFESSIONNEL"
            ? companyName
            : null,

        phone: phone || null,
        email: email || null,

        street: street || null,
        postalCode: postalCode || null,
        city: city || null,
      },
    });

    if (updated.count !== 1) notFound();

    redirect(`/clients/${id}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-6">
      <section className="forge-surface rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

        <div className="flex items-center gap-3">

          <Link
            href={`/clients/${id}`}
            className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Retour
          </Link>

          <div />

        </div>

        <ClientForm
          onSubmit={updateClient}
          submitLabel="Enregistrer les modifications"
          initialValues={{
            type: client.type,
            firstName: client.firstName,
            lastName: client.lastName,
            companyName: client.companyName,

            phone: client.phone ?? undefined,
            email: client.email,

            street: client.street ?? undefined,
            postalCode: client.postalCode ?? undefined,
            city: client.city ?? undefined,
          }}
        />

      </section>
    </main>
  );
}
