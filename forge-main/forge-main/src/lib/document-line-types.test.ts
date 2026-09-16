import assert from "node:assert/strict";
import test from "node:test";

import { DOCUMENT_LINE_TYPES, formatDocumentLineType, inferLegacyDocumentLineType, normalizeDocumentLineType } from "./document-line-types";
import { buildDocumentLinesFromForm } from "./document-lines";
import { templateLinesToEditable } from "./quote-templates";

test("centralise les types métier attendus sans enum fermé en base", () => {
  assert.deepEqual(DOCUMENT_LINE_TYPES.map((type) => type.value), ["MATERIAL", "SERVICE", "LABOR", "WORK", "TRAVEL", "RENTAL", "OTHER"]);
  assert.equal(formatDocumentLineType("SUBCONTRACTING"), "SUBCONTRACTING");
  assert.equal(normalizeDocumentLineType("future_type"), "FUTURE_TYPE");
});

test("une ancienne ligne reste classable avec un fallback sûr", () => {
  assert.equal(inferLegacyDocumentLineType("Matériel"), "MATERIAL");
  assert.equal(inferLegacyDocumentLineType("Ancienne ligne libre"), "OTHER");
});

test("main-d'œuvre, déplacement et location utilisent le calcul commun", () => {
  const lines = buildDocumentLinesFromForm(JSON.stringify([
    { lineType: "LABOR", category: "Main-d'œuvre plomberie", quantity: "3", unit: "h", unitPrice: "55", discount: "", cost: "30" },
    { lineType: "TRAVEL", category: "Déplacement", quantity: "1", unit: "forfait", unitPrice: "45", discount: "", cost: "" },
    { lineType: "RENTAL", category: "Location nacelle", quantity: "2", unit: "j", unitPrice: "150", discount: "", cost: "" },
  ]), 2000);
  assert.deepEqual(lines.map((line) => [line.lineType, line.amountCents]), [["LABOR", 16500], ["TRAVEL", 4500], ["RENTAL", 30000]]);
});

test("un ouvrage inséré est une copie modifiable indépendante du modèle", () => {
  const model = [{ lineType: "LABOR", category: "Main-d'œuvre", label: "Installation", quantityMilli: 2000, unit: "h", unitPriceCents: 5500, costCents: 3000, discountBp: 0, vatRateBp: 2000 }];
  const inserted = templateLinesToEditable(model);
  model[0].quantityMilli = 3000;
  inserted[0].quantity = "4";
  assert.equal(model[0].quantityMilli, 3000);
  assert.equal(inserted[0].quantity, "4");
  assert.equal(inserted[0].unitPrice, "55.00");
});
