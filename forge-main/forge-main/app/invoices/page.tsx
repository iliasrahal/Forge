import { prisma } from "@/src/lib/prisma";
import { requireCurrentUser } from "@/src/lib/auth";


function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}


function formatStatus(status: string) {
  const statuses: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    PAYEE: "Payée",
    EN_RETARD: "En retard",
    ANNULEE: "Annulée",
  };

  return statuses[status] ?? status;
}


function getClientName(client: {
  type: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}) {
  if (client.type === "PROFESSIONNEL") {
    return client.companyName ?? "Client professionnel";
  }

  return `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
    || "Client sans nom";
}



export default async function InvoicesPage() {

  const currentUser =
    await requireCurrentUser();


  console.log("AVANT RECHERCHE FACTURES", currentUser.id);


  const invoices =
    await prisma.invoice.findMany({

      where: {
        client: {
          userId: currentUser.id,
        },
      },

      include: {
        client: true,
      },

      orderBy: {
        createdAt: "desc",
      },

    });


  console.log("FACTURES TROUVEES :", invoices.length);



  return (

    <main className="mx-auto w-full max-w-3xl px-6 py-6 dark:bg-slate-950">


      <div className="mt-6 space-y-4">



        {invoices.length === 0 ? (


          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">


            <p className="text-slate-500 dark:text-slate-400">
              Aucune facture créée.
            </p>


          </div>



        ) : (


          invoices.map((invoice) => (


            <div
              key={invoice.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >


              <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
                {invoice.title}
              </h2>



              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {getClientName(invoice.client)}
              </p>



              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {formatAmount(invoice.amountCents)}
              </p>



              <span className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {formatStatus(invoice.status)}
              </span>



            </div>


          ))


        )}



      </div>



    </main>

  );
}