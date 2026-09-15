import assert from "node:assert/strict";
import test from "node:test";

import { getMaterialAnalysisFollowUp, validateMaterialIdentification } from "@/src/lib/material-analysis";

test("l'analyse conserve les inconnues comme null et les incertitudes séparément", () => {
  const result = validateMaterialIdentification({ equipmentType: "Pompe", brand: null, reference: null, confidence: "low", visibleCharacteristics: [{ name: "Couleur", value: "rouge" }], uncertainCharacteristics: [{ name: "Diamètre", possibleValue: "25", reason: "marquage flou" }], missingCriticalCharacteristics: ["Tension"], questions: ["Peux-tu photographier la plaque ?"], searchTerms: ["pompe"], warnings: [] });
  assert.equal(result.brand, null);
  assert.equal(result.reference, null);
  assert.equal(result.uncertainCharacteristics[0].possibleValue, "25");
  assert.deepEqual(result.missingCriticalCharacteristics, ["Tension"]);
});

test("privilégie une photo complémentaire après la première vue", () => {
  const identification = validateMaterialIdentification({ equipmentType: "Radiateur", brand: null, reference: null, confidence: "high", visibleCharacteristics: [], uncertainCharacteristics: [], missingCriticalCharacteristics: ["Puissance", "Dimensions"], questions: ["Quelle est la puissance ?", "Quelle est la largeur ?", "Quel est le raccordement ?"], searchTerms: ["radiateur"], warnings: [] });
  const followUp = getMaterialAnalysisFollowUp(identification, 1);
  assert.equal(followUp.requestPhoto, true);
  assert.match(followUp.photoPrompt ?? "", /plaque signalétique/);
  assert.deepEqual(followUp.questions, []);
});

test("après plusieurs photos, conserve au maximum deux questions indispensables", () => {
  const identification = validateMaterialIdentification({ equipmentType: "Radiateur", brand: null, reference: null, confidence: "high", visibleCharacteristics: [], uncertainCharacteristics: [], missingCriticalCharacteristics: ["Puissance"], questions: ["Quelle est la puissance ?", "Quelle est la largeur ?", "Quel est le raccordement ?"], searchTerms: ["radiateur"], warnings: [] });
  const followUp = getMaterialAnalysisFollowUp(identification, 2);
  assert.equal(followUp.requestPhoto, false);
  assert.deepEqual(followUp.questions, ["Quelle est la puissance ?", "Quelle est la largeur ?"]);
});
