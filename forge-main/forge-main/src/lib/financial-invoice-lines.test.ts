import assert from "node:assert/strict";
import test from "node:test";

import { buildFinancialInvoiceSlice } from "./financial-invoice-lines";

const lines = [
  { id: "a", lineType: "MATERIAL", category: "Matériel", label: "Matériel", quantityMilli: 1000, unit: "u", unitPriceCents: 10000, costCents: 6000, discountBp: 0, amountCents: 10000, vatRateBp: 2000 },
  { id: "b", lineType: "LABOR", category: "Pose", label: "Pose", quantityMilli: 1000, unit: "h", unitPriceCents: 10000, costCents: 4000, discountBp: 0, amountCents: 10000, vatRateBp: 1000 },
];

test("un acompte conserve plusieurs taux et le TTC demandé", () => {
  const slice = buildFinancialInvoiceSlice({ lines, quoteTtcCents: 23000, targetTtcCents: 6900, vatApplicable: true, discountBp: 0 });
  assert.equal(slice.totalTtcCents, 6900);
  assert.deepEqual(new Set(slice.byRate.map((rate) => rate.rateBp)), new Set([2000, 1000]));
  assert.equal(slice.lines.length, 2);
});

test("les snapshots financiers sont indépendants des lignes du devis", () => {
  const slice = buildFinancialInvoiceSlice({ lines, quoteTtcCents: 23000, targetTtcCents: 11500, vatApplicable: true, discountBp: 0 });
  slice.lines[0].amountCents = 1;
  assert.equal(lines[0].amountCents, 10000);
});
