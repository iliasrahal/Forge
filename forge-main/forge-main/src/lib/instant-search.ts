import { normalizeForSearch } from "@/src/lib/client-name";

export function buildSearchText(values: Array<string | null | undefined>) {
  return normalizeForSearch(values.filter(Boolean).join(" "));
}

export function matchesSearchText(searchText: string, query: string) {
  const needle = normalizeForSearch(query);
  return !needle || searchText.includes(needle);
}
