import assert from "node:assert/strict";
import test from "node:test";

import { computeStockChange, parseQuantityMilli } from "./stock";

test("convertit les quantités sans float métier", () => {
  assert.equal(parseQuantityMilli("2,5"), 2500);
  assert.equal(parseQuantityMilli("-1"), null);
});

test("calcule un coût moyen pondéré à l’entrée", () => {
  assert.deepEqual(computeStockChange({ currentMilli: 10_000, averageUnitCostCents: 100, deltaMilli: 10_000, incomingUnitCostCents: 200 }), { quantityMilli: 20_000, averageUnitCostCents: 150 });
});

test("préserve le coût historique à la sortie et protège le stock négatif", () => {
  assert.deepEqual(computeStockChange({ currentMilli: 10_000, averageUnitCostCents: 150, deltaMilli: -4_000 }), { quantityMilli: 6_000, averageUnitCostCents: 150 });
  assert.throws(() => computeStockChange({ currentMilli: 3_000, averageUnitCostCents: 150, deltaMilli: -8_000 }), /STOCK_INSUFFICIENT/);
  assert.equal(computeStockChange({ currentMilli: 3_000, averageUnitCostCents: 150, deltaMilli: -8_000, allowNegative: true }).quantityMilli, -5_000);
});
