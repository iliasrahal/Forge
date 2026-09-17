import assert from "node:assert/strict";
import test from "node:test";
import { computeClientFinancialSummary } from "./client-financials";

const payment = (amountCents: number) => ({ status: "SUCCEEDED", amountCents, feeCents: 0, refundedCents: 0 });
test("agrège facturé, encaissé et reste dû sans doubler les avoirs", () => {
  const result = computeClientFinancialSummary([
    { status: "PAYEE", amountCents: 10000, payments: [payment(10000)], creditNotes: [] },
    { status: "ENVOYEE", amountCents: 20000, payments: [payment(5000)], creditNotes: [{ status: "EMISE", amountCents: 3000 }] },
    { status: "BROUILLON", amountCents: 90000, payments: [], creditNotes: [] },
  ]);
  assert.deepEqual(result, { billedCents: 27000, collectedCents: 15000, remainingCents: 12000 });
});

test("une facture entièrement couverte par un avoir ne laisse aucun reste", () => {
  assert.deepEqual(computeClientFinancialSummary([{ status: "ENVOYEE", amountCents: 12000, payments: [], creditNotes: [{ status: "EMISE", amountCents: 12000 }] }]), { billedCents: 0, collectedCents: 0, remainingCents: 0 });
});
