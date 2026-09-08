import assert from "node:assert/strict";
import test from "node:test";
import { computeInterventionProfitability } from "./intervention-profitability";

test("distingue prévu, facturé, encaissé, dépenses et main-d'œuvre", () => {
  const result = computeInterventionProfitability({
    quote: { status: "ACCEPTE", amountCents: 800000, totalCostCents: 350000 },
    invoices: [{ status: "ENVOYEE", amountCents: 800000, payments: [{ status: "SUCCEEDED", amountCents: 300000, feeCents: 0, refundedCents: 0 }] }],
    expenses: [{ amountCents: 210000 }],
    workTimes: [{ durationMinutes: 4200, hourlyCostCents: 2500 }],
  });
  assert.equal(result.plannedMarginCents, 450000);
  assert.equal(result.billedRevenueCents, 800000);
  assert.equal(result.collectedRevenueCents, 300000);
  assert.equal(result.laborCostCents, 175000);
  assert.equal(result.actualMarginCents, 415000);
  assert.equal(result.marginVarianceCents, -35000);
});

test("le coût snapshoté ne dépend d'aucun coût membre courant", () => {
  const result = computeInterventionProfitability({ quote: null, invoices: [], expenses: [], workTimes: [{ durationMinutes: 600, hourlyCostCents: 2500 }] });
  assert.equal(result.laborCostCents, 25000);
});
