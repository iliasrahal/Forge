import assert from "node:assert/strict";
import test from "node:test";

import { buildPreparedQuoteLines, suggestServicesForMaterial, type SuggestibleService } from "@/src/lib/material-service-suggestions";
import type { MaterialIdentification } from "@/src/lib/material-matching";
import type { QuoteMaterialSnapshotSource } from "@/src/lib/quote-lines";

const material: QuoteMaterialSnapshotSource = { catalogItemId: "catalog-1", workspaceMaterialId: null, name: "Radiateur panneau", brand: "Atlantic", reference: "RAD-1000", specifications: { power: "1000 W" }, supplier: "", salePriceCents: 42000, purchasePriceCents: 30000, unit: "u" };
const identification: MaterialIdentification = { equipmentType: "Radiateur", brand: "Atlantic", reference: null, confidence: "high", visibleCharacteristics: [], uncertainCharacteristics: [], missingCriticalCharacteristics: [], questions: [], searchTerms: ["chauffage", "radiateur"], warnings: [] };
const services: SuggestibleService[] = [
  { id: "pose", name: "Pose radiateur", description: null, priceCents: 18000, pricingType: "FIXED" },
  { id: "depose", name: "Dépose ancien radiateur", description: "Chauffage", priceCents: 9000, pricingType: "FIXED" },
  { id: "robinet", name: "Remplacement robinet", description: null, priceCents: 7000, pricingType: "FIXED" },
];

test("propose uniquement les prestations réelles pertinentes", () => {
  assert.deepEqual(suggestServicesForMaterial(material, identification, services).map((service) => service.id), ["depose", "pose"]);
});

test("ne crée aucune prestation quand le catalogue ne contient rien de pertinent", () => {
  assert.deepEqual(suggestServicesForMaterial(material, identification, [services[2]]), []);
});

test("prépare uniquement le matériel et les prestations cochées avec leurs vrais prix", () => {
  const lines = buildPreparedQuoteLines(material, "2", [services[0]]);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].quantity, "2");
  assert.equal(lines[0].unitPrice, "420.00");
  assert.equal(lines[0].cost, "300.00");
  assert.equal(lines[1].category, "Pose radiateur");
  assert.equal(lines[1].unitPrice, "180.00");
});

test("un matériel sans prix reste à compléter sans prix inventé", () => {
  const lines = buildPreparedQuoteLines({ ...material, salePriceCents: 0, purchasePriceCents: null }, "1,5", []);
  assert.equal(lines[0].quantity, "1,5");
  assert.equal(lines[0].unitPrice, "0.00");
  assert.equal(lines[0].cost, "");
  assert.equal(lines.length, 1);
});
