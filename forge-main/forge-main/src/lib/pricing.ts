export const FORGE_PRICING = {
  STANDARD: {
    key: "STANDARD" as const,
    label: "Standard",
    amount: "29,99 €",
    monthlyLabel: "29,99 € / mois",
    features: [
      "Accès complet à ton espace personnel",
      "Assistant Forge à l’écrit et à la voix",
      "1 équipe (créée ou rejointe), jusqu’à 5 personnes",
    ],
  },
  PRO: {
    key: "PRO" as const,
    label: "Pro",
    amount: "49,99 €",
    monthlyLabel: "49,99 € / mois",
    features: [
      "Tout le plan Standard",
      "Plusieurs équipes (créées ou rejointes)",
      "Équipes de plus de 5 personnes",
    ],
  },
} as const;

// Alias historiques (workMode SOLO / TEAM).
export const FORGE_PRICING_LEGACY = {
  SOLO: FORGE_PRICING.STANDARD,
  TEAM: FORGE_PRICING.PRO,
} as const;

export const FORGE_PLANS = [FORGE_PRICING.STANDARD, FORGE_PRICING.PRO];

export function getForgePlan(
  workModeOrTier: "SOLO" | "TEAM" | "STANDARD" | "PRO" | null | undefined,
) {
  if (workModeOrTier === "PRO" || workModeOrTier === "TEAM") {
    return FORGE_PRICING.PRO;
  }

  return FORGE_PRICING.STANDARD;
}
