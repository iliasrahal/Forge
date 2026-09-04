import assert from "node:assert/strict";
import test from "node:test";

import {
  computeDocumentMargin,
  computeLineAmountCents,
  computeLineCostCents,
  formatQuantity,
  formatUnit,
  normalizeDiscountBp,
  normalizeUnit,
  parseQuantityToMilli,
} from "./document-lines";

test("montant HT = quantité × PU, remise de ligne appliquée", () => {
  // 12,5 h × 45,00 € = 562,50 €
  assert.equal(
    computeLineAmountCents({
      quantityMilli: 12500,
      unitPriceCents: 4500,
      discountBp: 0,
    }),
    56250,
  );
  // − 10 % => 506,25 €
  assert.equal(
    computeLineAmountCents({
      quantityMilli: 12500,
      unitPriceCents: 4500,
      discountBp: 1000,
    }),
    50625,
  );
});

test("quantité 1 forfait au PU = PU (compatibilité lignes historiques)", () => {
  assert.equal(
    computeLineAmountCents({
      quantityMilli: 1000,
      unitPriceCents: 124000,
      discountBp: 0,
    }),
    124000,
  );
});

test("coût de ligne = quantité × coût unitaire ; null => 0", () => {
  assert.equal(
    computeLineCostCents({
      quantityMilli: 12500,
      unitPriceCents: 4500,
      discountBp: 0,
      costCents: 2800,
    }),
    35000,
  );
  assert.equal(
    computeLineCostCents({
      quantityMilli: 12500,
      unitPriceCents: 4500,
      discountBp: 0,
      costCents: null,
    }),
    0,
  );
});

test("marge document = HT (remises incluses) − coûts", () => {
  const lines = [
    {
      quantityMilli: 12500,
      unitPriceCents: 4500,
      discountBp: 0,
      costCents: 2800,
      amountCents: 56250,
    },
    {
      quantityMilli: 3000,
      unitPriceCents: 9000,
      discountBp: 0,
      costCents: 7000,
      amountCents: 27000,
    },
  ];
  const m = computeDocumentMargin(lines);
  assert.equal(m.totalCostCents, 35000 + 21000);
  assert.equal(m.totalMarginCents, 56250 + 27000 - 56000);

  // Remise globale 5 % : le HT baisse, la marge aussi.
  const m2 = computeDocumentMargin(lines, 500);
  assert.equal(m2.totalMarginCents, Math.round(83250 * 0.95) - 56000);
});

test("parseQuantityToMilli / formatQuantity", () => {
  assert.equal(parseQuantityToMilli("12,5"), 12500);
  assert.equal(parseQuantityToMilli("8.25"), 8250);
  assert.equal(parseQuantityToMilli("3"), 3000);
  assert.equal(parseQuantityToMilli("abc"), 1000);
  assert.equal(parseQuantityToMilli("abc", 0), 0);
  assert.equal(formatQuantity(12500), "12,5");
  assert.equal(formatQuantity(1000), "1");
});

test("normalizeDiscountBp : pourcentage -> points de base, borné à 100 %", () => {
  assert.equal(normalizeDiscountBp("5"), 500);
  assert.equal(normalizeDiscountBp("12,5"), 1250);
  assert.equal(normalizeDiscountBp("-3"), 0);
  assert.equal(normalizeDiscountBp("250"), 10000);
});

test("normalizeUnit / formatUnit", () => {
  assert.equal(normalizeUnit("h"), "h");
  assert.equal(normalizeUnit("bidon"), "forfait");
  assert.equal(formatUnit("m2"), "m²");
  assert.equal(formatUnit("j"), "jour");
});
