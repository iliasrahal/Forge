import Link from "next/link";
import { ChevronRight } from "lucide-react";


type ClientCardProps = {
  client: {
    id: string;
    type: "PARTICULIER" | "PROFESSIONNEL";
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    phone: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
  };
};



export default function ClientCard({
  client,
}: ClientCardProps) {


  const name =
    client.type === "PARTICULIER"
      ? `${client.firstName ?? ""} ${
          client.lastName ?? ""
        }`.trim()
      : client.companyName ??
        "Client professionnel";

  const phoneClass = client.phone
    ? "mt-2 text-base text-slate-700 dark:text-slate-300"
    : "mt-2 text-base font-semibold text-blue-700 dark:text-blue-400";

  const cityClass = client.city
    ? "text-base text-slate-500 dark:text-slate-400"
    : "text-base font-semibold text-blue-700 dark:text-blue-400";



  return (
    <Link
      href={`/clients/${client.id}`}
      className="
        flex
        items-center
        justify-between
        rounded-2xl
        border
            <p className={phoneClass}>{client.phone || "Téléphone non renseigné"}</p>

            <p className={cityClass}>{client.city || "Ville non renseignée"}</p>
        dark:border-slate-700
        dark:bg-slate-900
        dark:hover:border-blue-500
      "
    >

      <div className="flex flex-col justify-center">


        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
          {name || "Client"}
        </h2>



        <p className="mt-2 text-base text-slate-700 dark:text-slate-300">
          {client.phone || "Téléphone non renseigné"}
        </p>



        <p className="text-base text-slate-500 dark:text-slate-400">
          {client.city || "Ville non renseignée"}
        </p>


      </div>



      <ChevronRight
        size={24}
        className="shrink-0 text-slate-400 dark:text-slate-500"
      />


    </Link>
  );
}