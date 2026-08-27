type InvoiceDescriptionSource = {
  description?: string | null;
  reportIntervention?: string | null;
  reportDiagnostic?: string | null;
  reportTravaux?: string | null;
  reportRecommendation?: string | null;
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function cleanInvoiceDescriptionValue(
  value?: string | null,
) {
  const cleanedValue = value?.trim() ?? "";

  if (!cleanedValue) {
    return "";
  }

  const normalizedValue = normalize(cleanedValue);
  const containsOnlyMissingValues =
    /^(non precise\s*)+$/.test(normalizedValue) ||
    normalizedValue ===
      "aucune recommandation particuliere";

  return containsOnlyMissingValues
    ? ""
    : cleanedValue;
}

export function buildInvoiceDescriptionParts(
  source: InvoiceDescriptionSource,
) {
  const fields = [
    ["Description", source.description],
    [
      "Intervention réalisée",
      source.reportIntervention,
    ],
    ["Diagnostic", source.reportDiagnostic],
    ["Travaux effectués", source.reportTravaux],
    ["Recommandation", source.reportRecommendation],
  ] as const;
  const seenValues = new Set<string>();

  return fields.flatMap(([label, value]) => {
    const cleanedValue =
      cleanInvoiceDescriptionValue(value);
    const normalizedValue = normalize(cleanedValue);

    if (
      !cleanedValue ||
      seenValues.has(normalizedValue)
    ) {
      return [];
    }

    seenValues.add(normalizedValue);
    return [`${label} : ${cleanedValue}`];
  });
}

export function buildInvoiceDescription(
  source: InvoiceDescriptionSource,
) {
  return buildInvoiceDescriptionParts(source).join(
    "\n\n",
  );
}
