import Link from "next/link";


import FixedForgeBar from "@/components/FixedForgeBar";
import ClientCard from "@/components/clients/ClientCard";
import { requireCurrentUser } from "@/src/lib/auth";
import { clientService } from "@/src/services/client.service";






export default async function ClientsPage() {
  const currentUser =
    await requireCurrentUser();






  const clients =
    await clientService.getAll(
      currentUser.id,
    );






  return (
    <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-xl flex-col px-6 py-6 pb-36">





      <div className="mb-6 flex justify-center gap-3">





        <Link
          href="/clients/new"
          className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          + Nouveau client
        </Link>






        <Link
          href="/history"
          className="rounded-2xl border border-blue-600 px-6 py-3 font-semibold text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950"
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