export const FORGE_TRADES = [
  { value: "plomberie", label: "Plomberie" },
  { value: "chauffage", label: "Chauffage" },
  { value: "climatisation", label: "Climatisation / HVAC" },
  { value: "electricite", label: "Électricité" },
  { value: "peinture", label: "Peinture" },
  { value: "menuiserie", label: "Menuiserie" },
  { value: "maconnerie", label: "Maçonnerie" },
] as const;

export function normalizeTradeSlugs(value: unknown) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(FORGE_TRADES.map((trade) => trade.value));
  return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim().toLowerCase()).filter((item) => allowed.has(item as typeof FORGE_TRADES[number]["value"])))];
}
