import assert from "node:assert/strict";
import test from "node:test";

import { validateMaterialIdentification } from "@/src/lib/material-analysis";

test("l'analyse conserve les inconnues comme null et les incertitudes séparément", () => {
  const result = validateMaterialIdentification({ equipmentType: "Pompe", brand: null, reference: null, confidence: "low", visibleCharacteristics: [{ name: "Couleur", value: "rouge" }], uncertainCharacteristics: [{ name: "Diamètre", possibleValue: "25", reason: "marquage flou" }], missingCriticalCharacteristics: ["Tension"], questions: ["Peux-tu photographier la plaque ?"], searchTerms: ["pompe"], warnings: [] });
  assert.equal(result.brand, null);
  assert.equal(result.reference, null);
  assert.equal(result.uncertainCharacteristics[0].possibleValue, "25");
  assert.deepEqual(result.missingCriticalCharacteristics, ["Tension"]);
});
