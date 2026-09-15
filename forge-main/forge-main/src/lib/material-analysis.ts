import type { MaterialIdentification } from "@/src/lib/material-matching";

export const MATERIAL_ANALYSIS_MODEL =
  process.env.OPENAI_MATERIAL_ANALYSIS_MODEL?.trim() || "gpt-4.1-mini";

export const MATERIAL_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["equipmentType", "brand", "reference", "confidence", "visibleCharacteristics", "uncertainCharacteristics", "missingCriticalCharacteristics", "questions", "searchTerms", "warnings"],
  properties: {
    equipmentType: { type: ["string", "null"] },
    brand: { type: ["string", "null"] },
    reference: { type: ["string", "null"] },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    visibleCharacteristics: {
      type: "array",
      maxItems: 20,
      items: { type: "object", additionalProperties: false, required: ["name", "value"], properties: { name: { type: "string" }, value: { type: "string" } } },
    },
    uncertainCharacteristics: {
      type: "array",
      maxItems: 20,
      items: { type: "object", additionalProperties: false, required: ["name", "possibleValue", "reason"], properties: { name: { type: "string" }, possibleValue: { type: "string" }, reason: { type: "string" } } },
    },
    missingCriticalCharacteristics: { type: "array", maxItems: 10, items: { type: "string" } },
    questions: { type: "array", maxItems: 5, items: { type: "string" } },
    searchTerms: { type: "array", maxItems: 15, items: { type: "string" } },
    warnings: { type: "array", maxItems: 10, items: { type: "string" } },
  },
} as const;

export const MATERIAL_ANALYSIS_PROMPT = `
Tu analyses des photos de matériel professionnel pour aider un artisan à rechercher son propre catalogue.
Tu dois décrire uniquement les informations réellement visibles. N'invente jamais une marque, une référence, une dimension, un diamètre, une puissance, une compatibilité ou un produit.
Si une inscription n'est pas parfaitement lisible, place-la dans uncertainCharacteristics et explique pourquoi. Une valeur inconnue reste null ou absente des caractéristiques visibles.
Une référence ne peut être renseignée que si elle est lisible explicitement sur une plaque ou une étiquette. Une marque suit la même règle.
Identifie les caractéristiques critiques manquantes qui empêchent de choisir une référence compatible. Pose au maximum cinq questions courtes, ou demande une autre photo ciblée (plaque, raccord, vue d'ensemble).
Les searchTerms sont des mots strictement dérivés des éléments visibles et servent uniquement à interroger le catalogue interne. Tu ne recommandes aucun produit toi-même.
Réponds en français et respecte exactement le schéma JSON imposé.
`.trim();

export function validateMaterialIdentification(value: unknown): MaterialIdentification {
  if (!value || typeof value !== "object") throw new Error("INVALID_MATERIAL_ANALYSIS");
  const item = value as Record<string, unknown>;
  const textOrNull = (input: unknown) => typeof input === "string" && input.trim() ? input.trim().slice(0, 240) : null;
  const strings = (input: unknown, max: number) => Array.isArray(input) ? input.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).slice(0, max).map((entry) => entry.trim().slice(0, 300)) : [];
  const visible = Array.isArray(item.visibleCharacteristics) ? item.visibleCharacteristics.map((entry) => {
    const row = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
    const name = textOrNull(row.name); const val = textOrNull(row.value);
    return name && val ? { name, value: val } : null;
  }).filter((entry): entry is { name: string; value: string } => entry !== null).slice(0, 20) : [];
  const uncertain = Array.isArray(item.uncertainCharacteristics) ? item.uncertainCharacteristics.map((entry) => {
    const row = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
    const name = textOrNull(row.name); const possibleValue = textOrNull(row.possibleValue); const reason = textOrNull(row.reason);
    return name && possibleValue && reason ? { name, possibleValue, reason } : null;
  }).filter((entry): entry is { name: string; possibleValue: string; reason: string } => entry !== null).slice(0, 20) : [];
  return {
    equipmentType: textOrNull(item.equipmentType),
    brand: textOrNull(item.brand),
    reference: textOrNull(item.reference),
    confidence: item.confidence === "high" || item.confidence === "medium" ? item.confidence : "low",
    visibleCharacteristics: visible,
    uncertainCharacteristics: uncertain,
    missingCriticalCharacteristics: strings(item.missingCriticalCharacteristics, 10),
    questions: strings(item.questions, 5),
    searchTerms: strings(item.searchTerms, 15),
    warnings: strings(item.warnings, 10),
  };
}
