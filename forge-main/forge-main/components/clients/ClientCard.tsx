import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getClientDisplayName } from "@/src/lib/client-name";

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
  const name = getClientDisplayName(client) || "Client";

  return (
    <Link
      href={`/clients/${client.id}`}
      className="forge-surface group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950/50 sm:px-5 sm:py-3.5"
    >
      <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--forge-text-primary)] sm:text-lg">
        {name}
      </h2>

      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--forge-text-muted)] transition group-hover:text-blue-600 dark:group-hover:text-blue-300">
        <ChevronRight size={20} />
      </span>
    </Link>
  );
}
