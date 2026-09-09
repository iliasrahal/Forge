import assert from "node:assert/strict";
import test from "node:test";

import {
  computeBalanceInvoiceAmount,
  computeRetentionCents,
  computeSituationInvoiceAmount,
  getQuoteBillingLedger,
} from "./quote-billing";

test("getQuoteBillingLedger : cumule les factures non annulées", () => {
  const ledger = getQuoteBillingLedger(1_000_000, [
    { type: "DEPOSIT", status: "PAYEE", amountCents: 300_000, retentionCents: 0 },
    {
      type: "SITUATION",
      status: "ENVOYEE",
      amountCents: 300_000,
      retentionCents: 15_000,
    },
    { type: "SITUATION", status: "ANNULEE", amountCents: 999_999 },
  ]);
  assert.equal(ledger.billedCents, 600_000);
  assert.equal(ledger.billedBp, 6000);
  assert.equal(ledger.remainingCents, 400_000);
  assert.equal(ledger.retentionWithheldCents, 15_000);
  assert.equal(ledger.situationCount, 1);
  assert.equal(ledger.isFullyBilled, false);
});

test("getQuoteBillingLedger : facturé au-delà du devis reste borné à 100 %", () => {
  const ledger = getQuoteBillingLedger(100_000, [
    { type: "STANDARD", status: "PAYEE", amountCents: 120_000 },
  ]);
  assert.equal(ledger.billedBp, 10000);
  assert.equal(ledger.remainingCents, 0);
  assert.equal(ledger.isFullyBilled, true);
});

test("computeRetentionCents : 5 % arrondi au centime", () => {
  assert.equal(computeRetentionCents(300_000, 500), 15_000);
  assert.equal(computeRetentionCents(136_499, 500), 6_825);
  assert.equal(computeRetentionCents(300_000, 0), 0);
});

test("computeSituationInvoiceAmount : part de l'avancement moins le déjà facturé", () => {
  const first = computeSituationInvoiceAmount({
    quoteTtcCents: 1_000_000,
    targetProgressBp: 3000,
    alreadyBilledCents: 0,
  });
  assert.deepEqual(first, {
    ok: true,
    amountCents: 300_000,
    cumulativeTargetCents: 300_000,
  });

  const second = computeSituationInvoiceAmount({
    quoteTtcCents: 1_000_000,
    targetProgressBp: 7500,
    alreadyBilledCents: 300_000,
  });
  assert.deepEqual(second, {
    ok: true,
    amountCents: 450_000,
    cumulativeTargetCents: 750_000,
  });
});

test("computeSituationInvoiceAmount : refuse un avancement déjà atteint ou hors bornes", () => {
  assert.equal(
    computeSituationInvoiceAmount({
      quoteTtcCents: 1_000_000,
      targetProgressBp: 3000,
      alreadyBilledCents: 300_000,
    }).ok,
    false,
  );
  assert.equal(
    computeSituationInvoiceAmount({
      quoteTtcCents: 1_000_000,
      targetProgressBp: 0,
      alreadyBilledCents: 0,
    }).ok,
    false,
  );
  assert.equal(
    computeSituationInvoiceAmount({
      quoteTtcCents: 1_000_000,
      targetProgressBp: 12000,
      alreadyBilledCents: 0,
    }).ok,
    false,
  );
});

test("computeBalanceInvoiceAmount : le reste à facturer", () => {
  assert.equal(computeBalanceInvoiceAmount(1_000_000, 750_000), 250_000);
  assert.equal(computeBalanceInvoiceAmount(1_000_000, 1_000_000), 0);
  assert.equal(computeBalanceInvoiceAmount(1_000_000, 1_200_000), 0);
});
