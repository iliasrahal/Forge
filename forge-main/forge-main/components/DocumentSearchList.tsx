"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import InstantSearchInput from "@/components/InstantSearchInput";
import { statusChipClasses } from "@/src/lib/document-status-style";
import {
  buildSearchText,
  matchesSearchText,
} from "@/src/lib/instant-search";

export type SearchableDocument = {
  id: string;
  href: string;
  title: string;
  reference: string;
  date: string;
  amount: string;
  status: string;
  statusLabel: string;
  searchValues: string[];
  clientLabel?: string;
  badge?: string;
  attention?: string;
};

type Props = {
  documents: SearchableDocument[];
  documentLabel: "devis" | "facture";
  placeholder: string;
};

export default function DocumentSearchList({
  documents,
  documentLabel,
  placeholder,
}: Props) {
  const [query, setQuery] = useState("");
  const indexedDocuments = useMemo(
    () =>
      documents.map((document) => ({
        document,
        search: buildSearchText(document.searchValues),
      })),
    [documents],
  );
  const results = indexedDocuments.filter(({ search }) =>
    matchesSearchText(search, query),
  );

  return (
    <div>
      <InstantSearchInput
        value={query}
        onChange={setQuery}
        placeholder={placeholder}
        ariaLabel={`Rechercher un ${documentLabel}`}
      />

      {query ? (
        <p className="mt-2 px-1 text-xs text-[var(--forge-text-muted)]">
          {results.length} {documentLabel}{results.length > 1 ? "s" : ""} sur{" "}
          {documents.length}
        </p>
      ) : null}

      <div className="mt-4">
        {results.length > 0 ? (
          <ul className="space-y-2">
            {results.map(({ document }) => (
              <li key={document.id}>
                <Link
                  href={document.href}
                  aria-label={`Ouvrir ${documentLabel === "devis" ? "le devis" : "la facture"} ${document.reference}`}
                  className="forge-surface flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950/50"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-[var(--forge-text-primary)]">
                      <span className="truncate">{document.title}</span>
                      {document.badge ? (
                        <span className="shrink-0 rounded-full border border-[var(--forge-border)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--forge-text-muted)]">
                          {document.badge}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs tabular-nums text-[var(--forge-text-muted)]">
                      {document.reference} · {document.date}
                      {document.clientLabel ? ` · ${document.clientLabel}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    {document.attention ? (
                      <span className="hidden text-xs font-semibold text-amber-600 sm:inline dark:text-amber-400">
                        {document.attention}
                      </span>
                    ) : null}
                    <span className="forge-num text-sm font-bold text-[var(--forge-text-primary)]">
                      {document.amount}
                    </span>
                    <span className={statusChipClasses(document.status)}>
                      {document.statusLabel}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--forge-border)] px-6 py-10 text-center text-sm text-[var(--forge-text-muted)]">
            Aucun {documentLabel} ne correspond à «&nbsp;{query.trim()}&nbsp;».
          </p>
        )}
      </div>
    </div>
  );
}
