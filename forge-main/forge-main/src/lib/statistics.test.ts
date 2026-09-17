import assert from "node:assert/strict";
import test from "node:test";

import { buildOperationalStatistics, buildStatistics, percentageChange, previousStatisticsRange, resolveStatisticsRange } from "./statistics";

const range = resolveStatisticsRange({ period: "30d", now: new Date("2026-09-15T10:00:00Z") });

test("calcule le CA encaissé depuis les paiements réussis de la période", () => {
  const result = buildStatistics({
    range,
    invoices: [],
    quotes: [],
    payments: [10000, 20000, 30000].map((amountCents, index) => ({
      id: String(index), invoiceId: String(index), clientId: "c1", clientName: "Charles",
      invoiceStatus: "PAYEE",
      amountCents, feeCents: 0, refundedCents: index === 2 ? 30000 : 0,
      status: "SUCCEEDED", paidAt: new Date("2026-09-10T10:00:00Z"),
    })),
  });
  assert.equal(result.collectedCents, 30000);
  assert.equal(result.topClients[0].collectedCents, 30000);
});

test("exclut brouillons et annulées du CA facturé et calcule le reste avec paiements partiels", () => {
  const base = { quoteId: null, clientId: "c1", createdAt: new Date("2026-09-10T10:00:00Z"), payments: [], creditNotes: [] };
  const result = buildStatistics({
    range,
    quotes: [], payments: [],
    invoices: [
      { ...base, id: "1", amountCents: 10000, status: "ENVOYEE", payments: [{ status: "SUCCEEDED", amountCents: 4000, feeCents: 0, refundedCents: 0, paidAt: new Date() }] },
      { ...base, id: "2", amountCents: 20000, status: "PAYEE", payments: [{ status: "SUCCEEDED", amountCents: 20000, feeCents: 0, refundedCents: 0, paidAt: new Date() }] },
      { ...base, id: "3", amountCents: 30000, status: "BROUILLON" },
    ],
  });
  assert.equal(result.billedCents, 30000);
  assert.equal(result.remainingCents, 6000);
});

test("le taux d'acceptation ignore brouillons et devis encore en attente", () => {
  const sentAt = new Date("2026-09-10T10:00:00Z");
  const quote = (id: string, status: string, invoices: { status: string }[] = []) => ({ id, status, sentAt, invoices, amountCents: 10000 });
  const result = buildStatistics({
    range, invoices: [], payments: [],
    quotes: [quote("1", "ACCEPTE", [{ status: "ENVOYEE" }]), quote("2", "REFUSE"), quote("3", "ENVOYE")],
  });
  assert.equal(result.acceptanceRate, 50);
  assert.equal(result.quoteToInvoiceRate, 33);
  assert.deepEqual(result.quoteCounts, { accepted: 1, refused: 1, pending: 1 });
});

test("une période personnalisée inversée est normalisée", () => {
  const custom = resolveStatisticsRange({ period: "custom", from: "2026-09-15", to: "2026-09-01" });
  assert.equal(custom.from, "2026-09-01");
  assert.equal(custom.to, "2026-09-15");
});

test("calcule vendu sur les devis acceptés et facturé net après avoir", () => {
  const acceptedAt = new Date("2026-09-10T10:00:00Z");
  const result = buildStatistics({ range, payments: [], quotes: [
    { id: "accepted", amountCents: 120000, status: "ACCEPTE", sentAt: acceptedAt, acceptedAt, invoices: [] },
    { id: "refused", amountCents: 90000, status: "REFUSE", sentAt: acceptedAt, invoices: [] },
  ], invoices: [{ id: "invoice", quoteId: "accepted", clientId: "c1", amountCents: 120000, status: "ENVOYEE", createdAt: acceptedAt, sentAt: acceptedAt, payments: [], creditNotes: [{ status: "EMISE", amountCents: 20000 }] }] });
  assert.equal(result.soldCents, 120000);
  assert.equal(result.billedCents, 100000);
  assert.equal(result.remainingCents, 100000);
});

test("agrège rentabilité, pertes, temps, achats et fournisseurs sans inventer les coûts incomplets", () => {
  const result = buildOperationalStatistics({
    interventions: [
      { id: "profitable", title: "Rentable", profitability: { quote: { status: "ACCEPTE", amountCents: 100000, totalCostCents: 30000 }, invoices: [], expenses: [{ amountCents: 10000, category: "TRAVEL" }], workTimes: [{ userId: "u1", memberName: "Alice", durationMinutes: 120, hourlyCostCents: 3000 }] } },
      { id: "loss", title: "Perte", profitability: { quote: { status: "ACCEPTE", amountCents: 20000, totalCostCents: 10000 }, invoices: [], expenses: [{ amountCents: 30000, category: "RENTAL" }], workTimes: [] } },
      { id: "unknown", title: "Incomplet", profitability: { quote: null, invoices: [], expenses: [], workTimes: [{ userId: "u2", memberName: "Bob", durationMinutes: 60, hourlyCostCents: null }] } },
    ],
    purchases: [{ totalAmountCents: 50000, supplierId: "s1", supplierName: "Cédéo" }, { totalAmountCents: 20000, supplierId: "s1", supplierName: "Cédéo" }],
  });
  assert.equal(result.totalCostCents, 46000);
  assert.equal(result.marginCents, 74000);
  assert.equal(result.plannedCostCents, 40000);
  assert.equal(result.incompleteInterventions, 1);
  assert.equal(result.interventions.at(-1)?.marginCents, -10000);
  assert.equal(result.workedMinutes, 180);
  assert.equal(result.purchasesCents, 70000);
  assert.equal(result.suppliers[0].amountCents, 70000);
});

test("gère les périodes métier et la comparaison sans Infinity", () => {
  const month = resolveStatisticsRange({ period: "month", now: new Date("2026-09-15T10:00:00Z") });
  const previousMonth = resolveStatisticsRange({ period: "previousMonth", now: new Date("2026-09-15T10:00:00Z") });
  assert.equal(month.from, "2026-09-01");
  assert.deepEqual([previousMonth.from, previousMonth.to], ["2026-08-01", "2026-08-31"]);
  assert.equal(previousStatisticsRange(month).to, "2026-08-31");
  assert.equal(percentageChange(100, 0), null);
  assert.equal(percentageChange(0, 0), 0);
});
