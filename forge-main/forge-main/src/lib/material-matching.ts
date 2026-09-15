import { materialSearchHaystack, type EffectiveMaterial } from "@/src/lib/material-catalog";

export type MaterialIdentification = {
  equipmentType: string | null;
  brand: string | null;
  reference: string | null;
  confidence: "low" | "medium" | "high";
  visibleCharacteristics: Array<{ name: string; value: string }>;
  uncertainCharacteristics: Array<{ name: string; possibleValue: string; reason: string }>;
  missingCriticalCharacteristics: string[];
  questions: string[];
  searchTerms: string[];
  warnings: string[];
};

function normalize(value: string | null | undefined) {
  return (value ?? "").toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export type MaterialMatch = { material: EffectiveMaterial; score: number; reasons: string[] };

export function matchMaterials(
  identification: MaterialIdentification,
  materials: EffectiveMaterial[],
  limit = 5,
): MaterialMatch[] {
  const reference = normalize(identification.reference);
  const brand = normalize(identification.brand);
  const equipmentType = normalize(identification.equipmentType);
  const terms = identification.searchTerms.map(normalize).filter(Boolean);
  const visible = identification.visibleCharacteristics.map((entry) => ({ name: normalize(entry.name), value: normalize(entry.value) }));

  return materials
    .filter((material) => material.active)
    .map((material) => {
      let score = 0;
      const reasons: string[] = [];
      const materialReference = normalize(material.reference);
      const materialBrand = normalize(material.brand);
      const haystack = normalize(materialSearchHaystack(material));
      if (reference && materialReference === reference) { score += 1000; reasons.push("Référence exacte"); }
      if (brand && materialBrand === brand) { score += 140; reasons.push("Marque correspondante"); }
      if (equipmentType && haystack.includes(equipmentType)) { score += 100; reasons.push("Type de matériel compatible"); }
      for (const characteristic of visible) {
        if (characteristic.value && haystack.includes(characteristic.value)) {
          score += 65;
          reasons.push(`${characteristic.name || "Caractéristique"} compatible`);
        }
      }
      for (const term of terms) if (term && haystack.includes(term)) score += 20;
      if (material.favorite && score > 0) { score += 5; reasons.push("Favori du workspace"); }
      return { material, score, reasons: [...new Set(reasons)] };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || left.material.name.localeCompare(right.material.name, "fr"))
    .slice(0, Math.max(1, Math.min(limit, 5)));
}

/** Classe le catalogue pour l'exploration artisan, sans prétendre garantir une
 * compatibilité. Contrairement au matching strict, un signal partiel suffit et
 * l'absence de signal conserve un accès aux références actives. */
export function recommendMaterials(
  identification: MaterialIdentification,
  materials: EffectiveMaterial[],
  limit = 20,
): MaterialMatch[] {
  const reference = normalize(identification.reference);
  const brand = normalize(identification.brand);
  const equipmentType = normalize(identification.equipmentType);
  const terms = identification.searchTerms.map(normalize).filter(Boolean);
  const visible = identification.visibleCharacteristics.map((entry) => ({
    name: normalize(entry.name),
    value: normalize(entry.value),
  }));

  return materials
    .filter((material) => material.active)
    .map((material) => {
      let score = 0;
      const reasons: string[] = [];
      const materialReference = normalize(material.reference);
      const materialBrand = normalize(material.brand);
      const haystack = normalize(materialSearchHaystack(material));
      if (reference && materialReference === reference) { score += 1000; reasons.push("Référence exacte"); }
      else if (reference && materialReference.includes(reference)) { score += 300; reasons.push("Référence proche"); }
      if (equipmentType && haystack.includes(equipmentType)) { score += 220; reasons.push("Même type de matériel"); }
      if (brand && materialBrand === brand) { score += 160; reasons.push("Même marque"); }
      for (const characteristic of visible) {
        if (characteristic.value && haystack.includes(characteristic.value)) {
          score += 70;
          reasons.push(`${characteristic.name || "Caractéristique"} correspondante`);
        }
      }
      for (const term of terms) if (term && haystack.includes(term)) score += 25;
      if (material.favorite) score += score > 0 ? 5 : 1;
      return { material, score, reasons: [...new Set(reasons)] };
    })
    .sort((left, right) => right.score - left.score || Number(right.material.favorite) - Number(left.material.favorite) || left.material.name.localeCompare(right.material.name, "fr"))
    .slice(0, Math.max(1, Math.min(limit, 50)));
}
