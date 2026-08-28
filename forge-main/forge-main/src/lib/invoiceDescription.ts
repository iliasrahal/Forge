type InvoiceDescriptionSource = {
  description?: string | null;
  reportIntervention?: string | null;
  reportDiagnostic?: string | null;
  reportTravaux?: string | null;
  reportRecommendation?: string | null;
};

export type InvoiceDescriptionSection = {
  label: string;
  content: string;
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

export function buildInvoiceDescriptionSections(
  source: InvoiceDescriptionSource,
) {
  const interventionValue =
    cleanInvoiceDescriptionValue(
      source.reportIntervention,
    ) ||
    cleanInvoiceDescriptionValue(
      source.description,
    );
  const fields = [
    ["Intervention réalisée", interventionValue],
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
    return [{ label, content: cleanedValue }];
  });
}

export function buildInvoiceDescriptionParts(
  source: InvoiceDescriptionSource,
) {
  return buildInvoiceDescriptionSections(source).map(
    ({ label, content }) => `${label} : ${content}`,
  );
}

export function parseInvoiceDescriptionSections(
  value?: string | null,
): InvoiceDescriptionSection[] {
  const cleanedValue =
    cleanInvoiceDescriptionValue(value);

  if (!cleanedValue) {
    return [];
  }

  const sectionPattern =
    /(?:^|\n+)\s*(Description|Intervention réalisée|Diagnostic|Travaux effectués|Recommandation)\s*:\s*/g;
  const matches = [...cleanedValue.matchAll(sectionPattern)];

  if (matches.length === 0) {
    return [
      {
        label: "Intervention réalisée",
        content: cleanedValue,
      },
    ];
  }

  return matches.flatMap((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < matches.length
        ? matches[index + 1].index
        : cleanedValue.length;
    const content = cleanInvoiceDescriptionValue(
      cleanedValue.slice(start, end),
    );

    if (!content) {
      return [];
    }

    return [
      {
        label:
          match[1] === "Description"
            ? "Intervention réalisée"
            : match[1],
        content,
      },
    ];
  });
}

export function buildInvoiceDescription(
  source: InvoiceDescriptionSource,
) {
  return buildInvoiceDescriptionParts(source).join(
    "\n\n",
  );
}
