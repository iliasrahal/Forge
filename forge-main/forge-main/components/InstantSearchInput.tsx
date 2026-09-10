"use client";

import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
};

export default function InstantSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: Props) {
  return (
    <div className="relative">
      <Search
        size={18}
        strokeWidth={2}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className="min-h-12 w-full rounded-2xl border border-[var(--forge-border-strong)] bg-[var(--forge-input-background)] py-2 pl-11 pr-10 text-[var(--forge-text-primary)] outline-none transition focus:border-[var(--forge-accent-blue)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--forge-text-muted)] transition hover:bg-[var(--forge-surface-hover)] hover:text-[var(--forge-text-primary)]"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
