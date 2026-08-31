import Link from "next/link";


import FixedForgeBar from "@/components/FixedForgeBar";
import ClientCard from "@/components/clients/ClientCard";
import { requireCurrentUser } from "@/src/lib/auth";
import { requireWorkspaceContext } from "@/src/lib/workspace-access";
import { clientService } from "@/src/services/client.service";






export default async function ClientsPage() {
  await requireCurrentUser();
  const workspaceContext = await requireWorkspaceContext("read");






  const clients =
    await clientService.getAll(
      workspaceContext.workspace.id,
    );






  return (
    <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-xl flex-col px-4 py-5 pb-40 sm:px-6 sm:py-6">





      <div className="mb-6 grid gap-3 sm:grid-cols-2">





        <Link
          href="/clients/new"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 sm:px-6"
        >
          + Nouveau client
        </Link>






        <Link
          href="/history"
          className="flex min-h-12 items-center justify-center rounded-2xl border border-blue-600 px-4 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950 sm:px-6"
        >
          Historique Interventions
        </Link>





      </div>






      <div className="flex-1">



        {clients.length > 0 ? (



          <div className="space-y-3">



            {clients.map((client) => (



              <ClientCard
                key={client.id}
                client={client}
              />



            ))}



          </div>




        ) : (




          <div className="text-center text-slate-500 dark:text-slate-400">



            <p>
              Aucun client créé.
            </p>



          </div>




        )}



      </div>






      <FixedForgeBar context="clients" />





    </main>
  );
}
