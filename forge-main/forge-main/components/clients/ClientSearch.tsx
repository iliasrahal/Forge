"use client";

import { useMemo, useState } from "react";

import ClientCard from "@/components/clients/ClientCard";
import InstantSearchInput from "@/components/InstantSearchInput";
import {
  getClientDisplayName,
} from "@/src/lib/client-name";
import {
  buildSearchText,
  matchesSearchText,
} from "@/src/lib/instant-search";

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
        search: buildSearchText([getClientDisplayName(client)]),
      })),
    [clients],
  );

  const results = indexed.filter((entry) =>
    matchesSearchText(entry.search, query),
  );

  return (
    <div>
      <InstantSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Rechercher un client"
        ariaLabel="Rechercher un client..."
      />

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
