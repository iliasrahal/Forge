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

export default function ClientCard({ client }: ClientCardProps) {
  const name =
    client.type === "PARTICULIER"
      ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
      : client.companyName ?? "Client professionnel";

  // Always display phone and city in gray (neutral) under the client name
  const phoneClass = "mt-2 text-base text-slate-500 dark:text-slate-400";
  const cityClass = "text-base text-slate-500 dark:text-slate-400";

  return (
    <Link
      href={`/clients/${client.id}`}
      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500"
    >
      <div className="flex flex-col justify-center">
        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
          {name || "Client"}
        </h2>

        <p className={phoneClass}>{client.phone || "Téléphone non renseigné"}</p>

        <p className={cityClass}>{client.city || "Adresse non renseignée"}</p>
      </div>

      <ChevronRight size={24} className="shrink-0 text-slate-400 dark:text-slate-500" />
    </Link>
  );
}
