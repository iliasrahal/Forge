import Link from "next/link";
import { redirect } from "next/navigation";

import ClientForm from "@/components/clients/ClientForm";
import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

async function createClient(formData: FormData) {
  "use server";

  const currentUser = await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("write");

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

  const afterCreate = formData.get("afterCreate") === "invoice"
    ? "invoice"
    : "client";


  if (
    type === "PARTICULIER" &&
    !firstName
  ) {
    throw new Error(
      "Le prénom est obligatoire.",
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
        organizationId: workspaceContext.workspace.id,
      },
    });


  redirect(
    afterCreate === "invoice"
      ? `/clients/${client.id}/invoices/new`
      : `/clients/${client.id}`,
  );
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
    from?: string;
  }>;
}) {
  await requireCurrentUser();
  await requireWorkspaceContext("write");

  const params = await searchParams;
  const fromInvoices = params.from === "invoices";


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
    <main className="mx-auto w-full max-w-3xl scroll-pb-[calc(10rem+env(safe-area-inset-bottom))] px-3 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-3 text-slate-950 sm:scroll-pb-[calc(12rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-[calc(12rem+env(safe-area-inset-bottom))] sm:pt-6 lg:scroll-pb-6 lg:pb-6 dark:text-white">
      <section className="forge-surface rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">

        <div className="flex items-center">
          <Link
            href={fromInvoices ? "/invoices/new" : "/clients"}
            aria-label={fromInvoices ? "Retour au choix du client" : "Retour à la liste des clients"}
            className="forge-back-link text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <span className="text-sm font-semibold">
              Retour
            </span>
          </Link>
        </div>

        {fromInvoices ? (
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            <Link
              href="/invoices/new"
              className="flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-center text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-blue-300"
            >
              Client existant
            </Link>
            <span className="flex min-h-11 items-center justify-center rounded-xl bg-white px-3 py-2 text-center text-sm font-semibold text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
              Nouveau client
            </span>
          </div>
        ) : null}


        <ClientForm
          onSubmit={createClient}
          initialValues={initialClient}
          cancelHref={fromInvoices ? "/invoices/new" : "/clients"}
          afterCreate={fromInvoices ? "invoice" : "client"}
          stickyActionsOnMobile={fromInvoices}
        />


      </section>
    </main>
  );
}
