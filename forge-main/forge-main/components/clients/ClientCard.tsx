import Link from "next/link";
import { ChevronRight } from "lucide-react";


type ClientCardProps = {
  client: {
    id: string;
    type: "PARTICULIER" | "PROFESSIONNEL";
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  };
};

export default function ClientCard({ client }: ClientCardProps) {
  const name =
    client.type === "PARTICULIER"
      ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
      : client.companyName ?? "Client professionnel";

  return (
    <Link
      href={`/clients/${client.id}`}
      className="group flex min-w-0 items-center justify-between gap-3 rounded-3xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.5)] backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-blue-600 sm:px-6 sm:py-4"
    >
      <div className="min-w-0 flex-1">
        <h2 className="break-words text-lg font-bold text-blue-700 dark:text-blue-400 sm:text-xl">
          {name || "Client"}
        </h2>
      </div>

      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-700 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-300">
        <ChevronRight size={21} />
      </span>
    </Link>
  );
}
