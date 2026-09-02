import assert from "node:assert/strict";
import test from "node:test";

import { calculateDepositAmount, getQuoteDepositSummary } from "./deposits";

test("calcule un acompte de 30 %", () => {
  assert.deepEqual(
    calculateDepositAmount({
      mode: "PERCENTAGE",
      value: "30",
      quoteTotalCents: 100000,
      alreadyDepositedCents: 0,
    }),
    {
      ok: true,
      amountCents: 30000,
      remainingBeforeCents: 100000,
      remainingAfterCents: 70000,
    },
  );
});

test("calcule un montant fixe décimal", () => {
  const result = calculateDepositAmount({
    mode: "FIXED",
    value: "250,50",
    quoteTotalCents: 100000,
    alreadyDepositedCents: 0,
  });
  assert.equal(result.ok && result.amountCents, 25050);
});

test("refuse zéro, négatif et plus de 100 %", () => {
  for (const value of ["0", "-10"]) {
    assert.equal(
      calculateDepositAmount({
        mode: "PERCENTAGE",
        value,
        quoteTotalCents: 100000,
        alreadyDepositedCents: 0,
      }).ok,
      false,
    );
  }
  assert.equal(
    calculateDepositAmount({
      mode: "PERCENTAGE",
      value: "101",
      quoteTotalCents: 100000,
      alreadyDepositedCents: 0,
    }).ok,
    false,
  );
});

test("refuse un montant supérieur au devis", () => {
  assert.equal(
    calculateDepositAmount({
      mode: "FIXED",
      value: "1000.01",
      quoteTotalCents: 100000,
      alreadyDepositedCents: 0,
    }).ok,
    false,
  );
});

test("additionne plusieurs acomptes et exclut uniquement les annulés", () => {
  assert.deepEqual(
    getQuoteDepositSummary(100000, [
      { type: "DEPOSIT", status: "BROUILLON", amountCents: 30000 },
      { type: "DEPOSIT", status: "PAYEE", amountCents: 20000 },
      { type: "DEPOSIT", status: "ANNULEE", amountCents: 10000 },
      { type: "STANDARD", status: "ENVOYEE", amountCents: 100000 },
    ]),
    { depositedCents: 50000, remainingCents: 50000 },
  );
});

test("refuse un dépassement après plusieurs acomptes", () => {
  assert.equal(
    calculateDepositAmount({
      mode: "FIXED",
      value: "500.01",
      quoteTotalCents: 100000,
      alreadyDepositedCents: 50000,
    }).ok,
    false,
  );
});
