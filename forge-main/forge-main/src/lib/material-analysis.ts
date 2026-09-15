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
    questions: { type: "array", maxItems: 2, items: { type: "string" } },
    searchTerms: { type: "array", maxItems: 15, items: { type: "string" } },
    warnings: { type: "array", maxItems: 10, items: { type: "string" } },
  },
} as const;

export const MATERIAL_ANALYSIS_PROMPT = `
Tu analyses des photos de matériel professionnel pour aider un artisan à rechercher son propre catalogue.
Tu dois décrire uniquement les informations réellement visibles. N'invente jamais une marque, une référence, une dimension, un diamètre, une puissance, une compatibilité ou un produit.
Si une inscription n'est pas parfaitement lisible, place-la dans uncertainCharacteristics et explique pourquoi. Une valeur inconnue reste null ou absente des caractéristiques visibles.
Une référence ne peut être renseignée que si elle est lisible explicitement sur une plaque ou une étiquette. Une marque suit la même règle.
Identifie uniquement les caractéristiques critiques manquantes qui empêchent réellement de choisir une référence compatible.
Adapte ces caractéristiques au matériel identifié : par exemple puissance/dimensions/raccordement pour un radiateur, capacité/orientation/raccordement pour un chauffe-eau, diamètre/type de raccord pour une vanne.
Une caractéristique lisible sur une plaque ou une autre vue ne doit pas devenir une question utilisateur : indique-la comme manquante afin que l'interface demande d'abord une photo complémentaire ciblée.
Si une information indispensable ne peut raisonnablement pas être obtenue visuellement, pose une seule question courte, ou au maximum deux si elles sont fortement liées. Ne produis jamais une liste générique de questions.
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
    questions: strings(item.questions, 2),
    searchTerms: strings(item.searchTerms, 15),
    warnings: strings(item.warnings, 10),
  };
}

export function getMaterialAnalysisFollowUp(identification: MaterialIdentification, photoCount: number) {
  const needsInput = identification.missingCriticalCharacteristics.length > 0 || identification.questions.length > 0;
  const requestPhoto = Boolean(identification.equipmentType) && needsInput && photoCount < 2;

  return {
    requestPhoto,
    photoPrompt: requestPhoto
      ? `Pour trouver le bon matériel, prends une photo de ${identification.reference ? "ses raccordements et dimensions" : "sa plaque signalétique"}.`
      : null,
    questions: requestPhoto ? [] : identification.questions.slice(0, 2),
  };
}
