import Link from "next/link";


import FixedForgeBar from "@/components/FixedForgeBar";
import ClientSearch from "@/components/clients/ClientSearch";
import { requireCurrentUser } from "@/src/lib/auth";
import { compareClientsByName } from "@/src/lib/client-name";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { clientService } from "@/src/services/client.service";






export default async function ClientsPage() {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");






  const clients = [
    ...(await clientService.getAll(workspaceContext.workspace.id)),
  ].sort(compareClientsByName);






  return (
    <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-xl flex-col px-4 py-5 pb-40 sm:px-6 sm:py-6">





      <div className={`mb-6 grid gap-3 ${workspaceContext.permissions.canWrite ? "sm:grid-cols-2" : ""}`}>





        {workspaceContext.permissions.canWrite ? (
          <Link
            href="/clients/new"
            className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 sm:px-6"
          >
            + Nouveau client
          </Link>
        ) : null}






        <Link
          href="/history"
          className="flex min-h-12 items-center justify-center rounded-2xl border border-blue-600 px-4 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950 sm:px-6"
        >
          Historique Interventions
        </Link>





      </div>






      <div className="flex-1">
        {clients.length > 0 ? (
          <ClientSearch clients={clients} />
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--forge-border)] px-6 py-14 text-center">
            <p className="text-base font-semibold text-[var(--forge-text-primary)]">
              Aucun client pour l’instant
            </p>
            <p className="mt-1 max-w-xs text-sm text-[var(--forge-text-muted)]">
              Ajoute ton premier client pour créer un devis ou une facture à son
              nom.
            </p>
            {workspaceContext.permissions.canWrite ? (
              <Link
                href="/clients/new"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700"
              >
                + Nouveau client
              </Link>
            ) : null}
          </div>
        )}
      </div>






      <FixedForgeBar context="clients" />





    </main>
  );
}
