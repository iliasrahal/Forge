"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import ClientCard from "@/components/clients/ClientCard";
import {
  getClientDisplayName,
  normalizeForSearch,
} from "@/src/lib/client-name";

type Client = {
  id: string;
  type: "PARTICULIER" | "PROFESSIONNEL";
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
};

export default function ClientSearch({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");

  const indexed = useMemo(
    () =>
      clients.map((client) => ({
        client,
        search: normalizeForSearch(getClientDisplayName(client)),
      })),
    [clients],
  );

  const needle = normalizeForSearch(query);
  const results = needle
    ? indexed.filter((entry) => entry.search.includes(needle))
    : indexed;

  return (
    <div>
      <div className="relative">
        <Search
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un client par son nom"
          aria-label="Rechercher un client"
          autoComplete="off"
          className="min-h-12 w-full rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] py-2 pl-11 pr-10 text-[var(--forge-text-primary)] outline-none transition focus:border-[var(--forge-accent-blue)] [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--forge-text-muted)] transition hover:bg-[var(--forge-surface-hover)] hover:text-[var(--forge-text-primary)]"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {query ? (
        <p className="mt-2 px-1 text-xs text-[var(--forge-text-muted)]">
          {results.length} client{results.length > 1 ? "s" : ""} sur{" "}
          {clients.length}
        </p>
      ) : null}

      <div className="mt-4">
        {results.length > 0 ? (
          <ul className="space-y-2">
            {results.map(({ client }) => (
              <li key={client.id}>
                <ClientCard client={client} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--forge-border)] px-6 py-10 text-center text-sm text-[var(--forge-text-muted)]">
            Aucun client ne correspond à «&nbsp;{query.trim()}&nbsp;».
          </p>
        )}
      </div>
    </div>
  );
}
