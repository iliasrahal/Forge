export const DOCUMENT_LINE_TYPES = [
  { value: "MATERIAL", label: "Matériel / Fourniture" },
  { value: "SERVICE", label: "Prestation" },
  { value: "LABOR", label: "Main-d'œuvre" },
  { value: "WORK", label: "Ouvrage" },
  { value: "TRAVEL", label: "Déplacement" },
  { value: "RENTAL", label: "Location" },
  { value: "OTHER", label: "Autre" },
] as const;

export type DocumentLineType = (typeof DOCUMENT_LINE_TYPES)[number]["value"];

const LABELS = new Map<string, string>(
  DOCUMENT_LINE_TYPES.map((type) => [type.value, type.label]),
);

export function formatDocumentLineType(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();
  return normalized ? LABELS.get(normalized) ?? value!.trim() : "Autre";
}

export function normalizeDocumentLineType(value: unknown, fallback = "OTHER") {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return normalized || fallback;
}

export function inferLegacyDocumentLineType(category: string | null | undefined) {
  const normalized = (category ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/materiel|fourniture|radiateur|chauffe|vanne|tuyau/.test(normalized)) return "MATERIAL";
  if (/main.?d.?oeuvre|main d'oeuvre/.test(normalized)) return "LABOR";
  if (/deplacement/.test(normalized)) return "TRAVEL";
  if (/location/.test(normalized)) return "RENTAL";
  if (/ouvrage/.test(normalized)) return "WORK";
  if (/prestation|service|installation|pose|depannage/.test(normalized)) return "SERVICE";
  return "OTHER";
}
