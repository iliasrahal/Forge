export const FORGE_PRICING = {
  SOLO: { label: "Travail seul", amount: "29,99 €", monthlyLabel: "29,99 € / mois" },
  TEAM: { label: "Travail en équipe", amount: "49,99 €", monthlyLabel: "49,99 € / mois" },
} as const;

export function getForgePlan(workMode: "SOLO" | "TEAM" | null | undefined) {
  return workMode === "TEAM" ? FORGE_PRICING.TEAM : FORGE_PRICING.SOLO;
}
