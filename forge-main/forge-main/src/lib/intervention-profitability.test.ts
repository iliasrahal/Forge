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

test("un chantier sans devis ne fabrique ni vendu ni marge", () => {
  const result = computeInterventionProfitability({ quote: null, invoices: [], expenses: [], workTimes: [] });
  assert.equal(result.soldRevenueCents, null);
  assert.equal(result.actualMarginCents, null);
  assert.equal(result.actualMarginPercent, null);
});

test("ignore un devis non accepté mais conserve facturé et encaissé", () => {
  const result = computeInterventionProfitability({
    quote: { status: "BROUILLON", amountCents: 100000, totalCostCents: 20000 },
    invoices: [{ status: "ENVOYEE", amountCents: 40000, payments: [{ status: "SUCCEEDED", amountCents: 15000, feeCents: 0, refundedCents: 0 }] }],
    expenses: [], workTimes: [],
  });
  assert.equal(result.soldRevenueCents, null);
  assert.equal(result.billedRevenueCents, 40000);
  assert.equal(result.collectedRevenueCents, 15000);
});

test("additionne acompte situation et solde comme documents incrémentaux et déduit les avoirs", () => {
  const result = computeInterventionProfitability({ quote: null, expenses: [], workTimes: [], invoices: [
    { status: "PAYEE", amountCents: 20000, payments: [{ status: "SUCCEEDED", amountCents: 20000, feeCents: 0, refundedCents: 0 }], creditNotes: [] },
    { status: "ENVOYEE", amountCents: 50000, payments: [{ status: "SUCCEEDED", amountCents: 10000, feeCents: 0, refundedCents: 0 }], creditNotes: [{ status: "EMISE", amountCents: 5000 }] },
    { status: "BROUILLON", amountCents: 30000, payments: [], creditNotes: [] },
  ] });
  assert.equal(result.grossBilledRevenueCents, 70000);
  assert.equal(result.creditedCents, 5000);
  assert.equal(result.billedRevenueCents, 65000);
  assert.equal(result.collectedRevenueCents, 30000);
});

test("calcule matériel snapshoté et évite de doubler une dépense matériau", () => {
  const result = computeInterventionProfitability({ quote: null, invoices: [], workTimes: [],
    materialUsages: [{ quantityMilli: 12000, actualUnitCostCents: 300 }],
    expenses: [{ category: "MATERIALS", amountCents: 3600 }, { category: "TRAVEL", amountCents: 1200 }],
  });
  assert.equal(result.knownMaterialUsageCostCents, 3600);
  assert.equal(result.materialsCostCents, 3600);
  assert.equal(result.nonMaterialExpenseCents, 1200);
  assert.equal(result.totalCostCents, 4800);
});

test("une utilisation reliée à un achat ne double pas son allocation", () => {
  const result = computeInterventionProfitability({ quote: null, invoices: [], workTimes: [], expenses: [],
    materialUsages: [{ quantityMilli: 8000, actualUnitCostCents: 300, purchaseLineId: "line-1" }],
    purchaseAllocations: [{ amountCents: 2400, lineType: "MATERIAL", materialUsageId: "usage-1" }],
  });
  assert.equal(result.materialsCostCents, 2400);
  assert.equal(result.totalCostCents, 2400);
});

test("une affectation d’achat directe contribue une seule fois au chantier", () => {
  const result = computeInterventionProfitability({ quote: null, invoices: [], workTimes: [], expenses: [{ amountCents: 15000, category: "RENTAL", purchaseId: "purchase-1" }],
    purchaseAllocations: [{ amountCents: 15000, lineType: "RENTAL", materialUsageId: null }],
  });
  assert.equal(result.nonMaterialExpenseCents, 15000);
  assert.equal(result.totalCostCents, 15000);
});

test("signale un coût incomplet au lieu de valoriser le temps ou le matériel à zéro", () => {
  const result = computeInterventionProfitability({
    quote: { status: "ACCEPTE", amountCents: 100000, totalCostCents: 30000 }, invoices: [], expenses: [],
    workTimes: [{ userId: "u1", memberName: "Alice", durationMinutes: 120, hourlyCostCents: null }],
    materialUsages: [{ quantityMilli: 1000, actualUnitCostCents: null }],
  });
  assert.equal(result.totalCostComplete, false);
  assert.equal(result.totalCostCents, null);
  assert.equal(result.actualMarginCents, null);
  assert.equal(result.timeByMember[0].costComplete, false);
});

test("compare le prévu au réel et agrège le temps Team par membre", () => {
  const result = computeInterventionProfitability({
    quote: { status: "ACCEPTE", amountCents: 100000, totalCostCents: 40000, lines: [
      { lineType: "MATERIAL", quantityMilli: 2000, unit: "u", costCents: 10000 },
      { lineType: "LABOR", quantityMilli: 5000, unit: "h", costCents: 4000 },
    ] }, invoices: [], expenses: [], materialUsages: [{ quantityMilli: 2000, actualUnitCostCents: 12000 }],
    workTimes: [
      { userId: "u1", memberName: "Alice", durationMinutes: 120, hourlyCostCents: 2500 },
      { userId: "u1", memberName: "Alice", durationMinutes: 60, hourlyCostCents: 2500 },
      { userId: "u2", memberName: "Bob", durationMinutes: 210, hourlyCostCents: 3000 },
    ],
  });
  assert.equal(result.plannedLaborMinutes, 300);
  assert.equal(result.workedMinutes, 390);
  assert.equal(result.laborTimeVarianceMinutes, 90);
  assert.equal(result.timeByMember.length, 2);
  assert.equal(result.actualMarginCents, 58000);
  assert.equal(result.actualMarginPercent, 58);
});
