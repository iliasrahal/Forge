import assert from "node:assert/strict";
import test from "node:test";

import type { EffectiveMaterial } from "@/src/lib/material-catalog";
import { matchMaterials, recommendMaterials, type MaterialIdentification } from "@/src/lib/material-matching";

function material(id: string, patch: Partial<EffectiveMaterial>): EffectiveMaterial {
  return { id, catalogItemId: id, workspaceMaterialId: null, categoryId: null, categoryName: "Chauffage", name: id, brand: "", reference: "", description: "", specifications: {}, tags: [], unit: "u", purchasePriceCents: null, salePriceCents: 1000, supplier: "", favorite: false, active: true, isFixture: true, ...patch };
}
const base: MaterialIdentification = { equipmentType: "circulateur", brand: null, reference: null, confidence: "medium", visibleCharacteristics: [], uncertainCharacteristics: [], missingCriticalCharacteristics: [], questions: [], searchTerms: ["circulateur"], warnings: [] };

test("une référence exacte domine le classement", () => {
  const matches = matchMaterials({ ...base, brand: "Forge Test", reference: "FT-CIRC-25-60" }, [
    material("exact", { name: "Circulateur 25-60", brand: "Forge Test", reference: "FT-CIRC-25-60" }),
    material("generic", { name: "Circulateur générique", favorite: true }),
  ]);
  assert.equal(matches[0].material.id, "exact");
  assert.ok(matches[0].reasons.includes("Référence exacte"));
});

test("un favori ne crée jamais une compatibilité à lui seul", () => {
  const matches = matchMaterials(base, [material("valve", { name: "Vanne", favorite: true })]);
  assert.deepEqual(matches, []);
});

test("le matching ne retourne que les entrées fournies et actives", () => {
  const matches = matchMaterials(base, [material("active", { name: "Circulateur" }), material("inactive", { name: "Circulateur", active: false })]);
  assert.deepEqual(matches.map((match) => match.material.id), ["active"]);
});

test("les propositions restent disponibles avec seulement un type de matériel", () => {
  const matches = recommendMaterials(
    { ...base, equipmentType: "radiateur", brand: null, reference: null, searchTerms: [] },
    [
      material("radiator", { name: "Radiateur vertical", categoryName: "Radiateurs" }),
      material("pump", { name: "Pompe de relevage", categoryName: "Plomberie" }),
    ],
  );
  assert.equal(matches[0].material.id, "radiator");
  assert.equal(matches.length, 2);
});

test("les propositions classent référence, marque et caractéristiques sans exclure le reste du catalogue", () => {
  const matches = recommendMaterials(
    {
      ...base,
      equipmentType: "radiateur",
      brand: "Atlantic",
      reference: "RAD-1500",
      visibleCharacteristics: [{ name: "Puissance", value: "1500 W" }],
      searchTerms: [],
    },
    [
      material("other", { name: "Radiateur générique" }),
      material("exact", { name: "Radiateur vertical", brand: "Atlantic", reference: "RAD-1500", specifications: { puissance: "1500 W" } }),
    ],
  );
  assert.equal(matches[0].material.id, "exact");
  assert.ok(matches[0].reasons.includes("Référence exacte"));
  assert.equal(matches.length, 2);
});

test("une analyse imprécise ouvre encore le catalogue actif", () => {
  const matches = recommendMaterials(
    { ...base, equipmentType: null, searchTerms: [], missingCriticalCharacteristics: ["type"] },
    [material("favorite", { favorite: true }), material("other", {})],
  );
  assert.deepEqual(matches.map(({ material: item }) => item.id), ["favorite", "other"]);
});
