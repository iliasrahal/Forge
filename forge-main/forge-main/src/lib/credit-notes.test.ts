import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFullCreditNoteLinesFromInvoice,
  canCreateCreditNote,
  maxCreditableCents,
  sumIssuedCreditsCents,
} from "./credit-notes";

test("sumIssuedCreditsCents : seuls les avoirs émis comptent", () => {
  assert.equal(
    sumIssuedCreditsCents([
      { status: "EMISE", amountCents: 5000 },
      { status: "BROUILLON", amountCents: 9999 },
      { status: "ANNULEE", amountCents: 3000 },
      { status: "EMISE", amountCents: 1500 },
    ]),
    6500,
  );
});

test("maxCreditableCents : plafonné au TTC restant non couvert", () => {
  assert.equal(maxCreditableCents(136400, 0), 136400);
  assert.equal(maxCreditableCents(136400, 100000), 36400);
  assert.equal(maxCreditableCents(136400, 136400), 0);
  assert.equal(maxCreditableCents(136400, 200000), 0);
});

test("canCreateCreditNote : pas depuis un brouillon ni une facture annulée", () => {
  assert.equal(canCreateCreditNote("ENVOYEE"), true);
  assert.equal(canCreateCreditNote("PAYEE"), true);
  assert.equal(canCreateCreditNote("EN_RETARD"), true);
  assert.equal(canCreateCreditNote("BROUILLON"), false);
  assert.equal(canCreateCreditNote("ANNULEE"), false);
});

test("buildFullCreditNoteLinesFromInvoice : reprise fidèle, montants positifs", () => {
  const lines = buildFullCreditNoteLinesFromInvoice([
    {
      category: "Main d'œuvre",
      label: "Pose",
      quantityMilli: 2000,
      unit: "h",
      unitPriceCents: 4500,
      discountBp: 500,
      amountCents: 8550,
      vatRateBp: 2000,
    },
  ]);
  assert.deepEqual(lines, [
    {
      category: "Main d'œuvre",
      label: "Pose",
      quantityMilli: 2000,
      unit: "h",
      unitPriceCents: 4500,
      discountBp: 500,
      amountCents: 8550,
      vatRateBp: 2000,
    },
  ]);
});
