import type { MaterialIdentification } from "@/src/lib/material-matching";
import { createMaterialLineSnapshot, createQuoteLineSnapshot, type QuoteMaterialSnapshotSource } from "@/src/lib/quote-lines";
import type { ServicePricingTypeValue } from "@/src/lib/service-catalog";

export type SuggestibleService = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  pricingType: ServicePricingTypeValue;
};

const STOP_WORDS = new Set(["avec", "dans", "pour", "sans", "sous", "sur", "une", "des", "les", "par", "materiel", "installation"]);

function normalize(value: string) {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value: string) {
  return [...new Set(normalize(value).split(" ").filter((token) => token.length >= 3 && !STOP_WORDS.has(token)))];
}

export function suggestServicesForMaterial(
  material: QuoteMaterialSnapshotSource,
  identification: MaterialIdentification,
  services: SuggestibleService[],
  limit = 5,
) {
  const equipmentType = normalize(identification.equipmentType ?? "");
  const sourceTokens = tokens([
    identification.equipmentType,
    material.name,
    material.brand,
    material.reference,
    ...identification.searchTerms,
    ...Object.keys(material.specifications),
    ...Object.values(material.specifications),
  ].filter(Boolean).join(" "));

  return services
    .map((service) => {
      const haystack = normalize(`${service.name} ${service.description ?? ""}`);
      let score = equipmentType && haystack.includes(equipmentType) ? 100 : 0;
      for (const token of sourceTokens) if (haystack.includes(token)) score += 10;
      return { service, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.service.name.localeCompare(right.service.name, "fr"))
    .slice(0, Math.max(1, Math.min(limit, 5)))
    .map(({ service }) => service);
}

export function buildPreparedQuoteLines(
  material: QuoteMaterialSnapshotSource,
  quantity: string,
  selectedServices: SuggestibleService[],
) {
  const materialLine = {
    ...createMaterialLineSnapshot(material),
    quantity: quantity.trim().replace(".", ","),
  };
  return [materialLine, ...selectedServices.map((service) => createQuoteLineSnapshot(service))];
}
