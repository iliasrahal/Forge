export const INTERVENTION_EXPENSE_CATEGORIES = [
  "MATERIALS",
  "SUPPLIES",
  "TRAVEL",
  "RENTAL",
  "SUBCONTRACTING",
  "OTHER",
] as const;

export type InterventionExpenseCategoryValue = typeof INTERVENTION_EXPENSE_CATEGORIES[number];

export const INTERVENTION_EXPENSE_LABELS: Record<InterventionExpenseCategoryValue, string> = {
  MATERIALS: "Matériaux",
  SUPPLIES: "Fournitures",
  TRAVEL: "Déplacement",
  RENTAL: "Location",
  SUBCONTRACTING: "Sous-traitance",
  OTHER: "Autre",
};

export function normalizeInterventionExpenseCategory(value: unknown): InterventionExpenseCategoryValue {
  return INTERVENTION_EXPENSE_CATEGORIES.includes(value as InterventionExpenseCategoryValue)
    ? value as InterventionExpenseCategoryValue
    : "OTHER";
}
