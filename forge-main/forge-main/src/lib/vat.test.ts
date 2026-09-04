import assert from "node:assert/strict";
import test from "node:test";

import {
  computeDocumentTotals,
  formatVatRateBp,
  normalizeVatRateBp,
  vatApplicableForScheme,
} from "./vat";

test("sans TVA applicable : TTC = HT, aucune ventilation", () => {
  const totals = computeDocumentTotals(
    [
      { amountCents: 120000, vatRateBp: 2000 },
      { amountCents: 30000, vatRateBp: 1000 },
    ],
    false,
  );

  assert.equal(totals.totalHtCents, 150000);
  assert.equal(totals.totalVatCents, 0);
  assert.equal(totals.totalTtcCents, 150000);
  assert.deepEqual(totals.byRate, []);
});

test("taux unique 20 % : TVA = 20 % du HT", () => {
  const totals = computeDocumentTotals(
    [{ amountCents: 100000, vatRateBp: 2000 }],
    true,
  );

  assert.equal(totals.totalHtCents, 100000);
  assert.equal(totals.totalVatCents, 20000);
  assert.equal(totals.totalTtcCents, 120000);
  assert.deepEqual(totals.byRate, [
    { rateBp: 2000, baseCents: 100000, vatCents: 20000 },
  ]);
});

test("multi-taux : TVA calculée par taux sur la base agrégée, puis sommée", () => {
  const totals = computeDocumentTotals(
    [
      { amountCents: 100000, vatRateBp: 2000 }, // 20 000
      { amountCents: 50000, vatRateBp: 1000 }, //  5 000
      { amountCents: 20000, vatRateBp: 550 }, //  1 100
      { amountCents: 40000, vatRateBp: 2000 }, //  regroupé avec le premier
      { amountCents: 10000, vatRateBp: 0 }, //      0
    ],
    true,
  );

  assert.equal(totals.totalHtCents, 220000);
  // base 20 % = 140 000 -> 28 000 ; base 10 % = 50 000 -> 5 000 ;
  // base 5,5 % = 20 000 -> 1 100 ; base 0 % -> 0
  assert.equal(totals.totalVatCents, 28000 + 5000 + 1100);
  assert.equal(totals.totalTtcCents, 220000 + 34100);
  assert.deepEqual(
    totals.byRate.map((entry) => entry.rateBp),
    [2000, 1000, 550, 0],
  );
  assert.equal(
    totals.byRate.find((entry) => entry.rateBp === 2000)?.vatCents,
    28000,
  );
});

test("arrondi au centime, demi vers le haut", () => {
  // 5,5 % de 100,05 € = 5,50275 € -> 5,50 € (arrondi)
  const totals = computeDocumentTotals(
    [{ amountCents: 10005, vatRateBp: 550 }],
    true,
  );
  assert.equal(totals.totalVatCents, 550);

  // 5,5 % de 100,10 € = 5,5055 € -> 5,51 €
  const totals2 = computeDocumentTotals(
    [{ amountCents: 10010, vatRateBp: 550 }],
    true,
  );
  assert.equal(totals2.totalVatCents, 551);
});

test("normalizeVatRateBp ramène toute valeur inconnue au repli", () => {
  assert.equal(normalizeVatRateBp("2000"), 2000);
  assert.equal(normalizeVatRateBp(550), 550);
  assert.equal(normalizeVatRateBp("abc", 1000), 1000);
  assert.equal(normalizeVatRateBp(1234, 0), 0);
});

test("formatVatRateBp affiche le taux à la française", () => {
  assert.equal(formatVatRateBp(2000), "20 %");
  assert.equal(formatVatRateBp(550), "5,5 %");
  assert.equal(formatVatRateBp(0), "0 %");
});

test("vatApplicableForScheme : seul SUBJECT facture la TVA", () => {
  assert.equal(vatApplicableForScheme("SUBJECT"), true);
  assert.equal(vatApplicableForScheme("FRANCHISE_BASE"), false);
});
