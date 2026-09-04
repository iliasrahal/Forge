import Link from "next/link";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";

type NewInvoicePageProps = {
  searchParams: Promise<{
    client?: string;
    title?: string;
    description?: string;
    invoiceLines?: string;
  }>;
};

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("write");

  const {
    client: clientSearch,
    title,
    description,
    invoiceLines,
  } = await searchParams;

  const cleanSearch = clientSearch?.trim() ?? "";
  const cleanTitle = title?.trim() ?? "";
  const cleanDescription = description?.trim() ?? "";

  const allClients = await prisma.client.findMany({
    where: {
      organizationId: workspaceContext.workspace.id,
      archived: false,
    },
    orderBy: { createdAt: "desc" },
  });

  const normalizedSearch = cleanSearch.toLowerCase();

  const clients = cleanSearch
    ? allClients.filter((client) => {
        const fullName =
          client.type === "PARTICULIER"
            ? `${client.firstName ?? ""} ${client.lastName ?? ""}`
                .trim()
                .toLowerCase()
            : (client.companyName ?? "").toLowerCase();
        return fullName.includes(normalizedSearch);
      })
    : allClients;

  function buildInvoiceFormUrl(clientId: string) {
    const params = new URLSearchParams();
    if (cleanTitle) params.set("title", cleanTitle);
    if (cleanDescription) params.set("description", cleanDescription);
    if (invoiceLines) params.set("invoiceLines", invoiceLines);
    const queryString = params.toString();
    return queryString
      ? `/clients/${clientId}/invoices/new?${queryString}`
      : `/clients/${clientId}/invoices/new`;
  }

  if (cleanSearch && clients.length === 1) {
    redirect(buildInvoiceFormUrl(clients[0].id));
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-6">
      <section className="forge-surface rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <Link
            href="/invoices"
            aria-label="Retour aux factures"
            className="forge-back-link text-base font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <span>Retour</span>
          </Link>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-blue-700 dark:text-blue-400">
          Nouvelle facture
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choisis le client de la facture.
        </p>

        {cleanSearch && (
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Résultats pour « {cleanSearch} »
          </p>
        )}

        {clients.length > 0 ? (
          <div className="mt-6 space-y-3">
            {clients.map((client) => {
              const clientName =
                client.type === "PARTICULIER"
                  ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
                  : client.companyName ?? "Client professionnel";
              return (
                <Link
                  key={client.id}
                  href={buildInvoiceFormUrl(client.id)}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500 dark:hover:bg-blue-950"
                >
                  <p className="font-semibold text-blue-700 dark:text-blue-400">
                    {clientName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {client.phone}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {client.postalCode} {client.city}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              {cleanSearch
                ? `Aucun client trouvé pour « ${cleanSearch} ».`
                : "Aucun client enregistré."}
            </p>
            <Link
              href="/clients/new"
              className="mt-4 inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Créer un client
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
