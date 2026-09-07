export const FORGE_MONTHLY_PRICE_CENTS = 2_999;

export const FORGE_PRICING = {
  key: "FORGE" as const,
  label: "Forge",
  amount: "29,99 €",
  monthlyLabel: "29,99 € / mois",
  features: [
    "Accès complet à ton espace personnel",
    "Assistant Forge à l’écrit et à la voix",
    "Espaces d’équipe sur invitation",
  ],
} as const;

export const FORGE_PLANS = [FORGE_PRICING];

/** Offre unique, quel que soit le mode de travail de l’utilisateur. */
export function getForgePlan() {
  return FORGE_PRICING;
}
