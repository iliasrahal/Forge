import assert from "node:assert/strict";
import test from "node:test";

import { buildStatistics, resolveStatisticsRange } from "./statistics";

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
