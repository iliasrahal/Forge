import assert from "node:assert/strict";
import test from "node:test";

import {
  computeInvoicePaymentState,
  formatPaymentMethod,
  isManualPaymentMethod,
  resolveInvoiceStatusAfterPayment,
} from "./payments";

const ok = (
  amountCents: number,
  extra: Partial<{ feeCents: number; refundedCents: number; paidAt: string }> = {},
) => ({
  status: "SUCCEEDED",
  amountCents,
  feeCents: extra.feeCents ?? 0,
  refundedCents: extra.refundedCents ?? 0,
  paidAt: extra.paidAt ?? "2026-05-02T10:00:00Z",
});

test("aucun paiement : tout reste dû", () => {
  const s = computeInvoicePaymentState(136400, []);
  assert.equal(s.collectedCents, 0);
  assert.equal(s.remainingCents, 136400);
  assert.equal(s.isFullyPaid, false);
  assert.equal(s.isPartiallyPaid, false);
});

test("paiement partiel puis solde", () => {
  const partial = computeInvoicePaymentState(136400, [ok(50000)]);
  assert.equal(partial.collectedCents, 50000);
  assert.equal(partial.remainingCents, 86400);
  assert.equal(partial.isPartiallyPaid, true);
  assert.equal(partial.isFullyPaid, false);

  const full = computeInvoicePaymentState(136400, [ok(50000), ok(86400)]);
  assert.equal(full.remainingCents, 0);
  assert.equal(full.isFullyPaid, true);
  assert.equal(full.isPartiallyPaid, false);
});

test("frais Stripe : net = encaissé − frais", () => {
  const s = computeInvoicePaymentState(136400, [
    ok(136400, { feeCents: 1240 }),
  ]);
  assert.equal(s.collectedCents, 136400);
  assert.equal(s.feeCents, 1240);
  assert.equal(s.netCents, 135160);
});

test("remboursement partiel : repasse sous le total", () => {
  const s = computeInvoicePaymentState(136400, [
    ok(136400, { refundedCents: 40000 }),
  ]);
  assert.equal(s.collectedCents, 96400);
  assert.equal(s.remainingCents, 40000);
  assert.equal(s.isFullyPaid, false);
});

test("les paiements non réussis sont ignorés dans les totaux", () => {
  const s = computeInvoicePaymentState(100000, [
    { status: "PENDING", amountCents: 100000, feeCents: 0, refundedCents: 0 },
    { status: "FAILED", amountCents: 100000, feeCents: 0, refundedCents: 0 },
  ]);
  assert.equal(s.collectedCents, 0);
  assert.equal(s.remainingCents, 100000);
});

test("dernier paiement daté", () => {
  const s = computeInvoicePaymentState(200000, [
    ok(100000, { paidAt: "2026-05-01T09:00:00Z" }),
    ok(100000, { paidAt: "2026-05-10T15:00:00Z" }),
  ]);
  assert.equal(s.lastPaidAt?.toISOString(), "2026-05-10T15:00:00.000Z");
});

test("resolveInvoiceStatusAfterPayment : brouillon et annulée intacts", () => {
  const state = computeInvoicePaymentState(100000, [ok(100000)]);
  assert.equal(
    resolveInvoiceStatusAfterPayment({ currentStatus: "BROUILLON", state }).status,
    "BROUILLON",
  );
  assert.equal(
    resolveInvoiceStatusAfterPayment({ currentStatus: "ANNULEE", state }).status,
    "ANNULEE",
  );
});

test("resolveInvoiceStatusAfterPayment : soldée -> PAYEE", () => {
  const state = computeInvoicePaymentState(100000, [ok(100000)]);
  const r = resolveInvoiceStatusAfterPayment({
    currentStatus: "ENVOYEE",
    state,
  });
  assert.equal(r.status, "PAYEE");
  assert.ok(r.paidAt instanceof Date);
});

test("resolveInvoiceStatusAfterPayment : partielle en retard -> EN_RETARD", () => {
  const state = computeInvoicePaymentState(100000, [ok(30000)]);
  const r = resolveInvoiceStatusAfterPayment({
    currentStatus: "ENVOYEE",
    dueDate: "2026-01-01T00:00:00Z",
    state,
    now: new Date("2026-06-01T00:00:00Z"),
  });
  assert.equal(r.status, "EN_RETARD");
  assert.equal(r.paidAt, null);
});

test("libellés et validation des moyens de paiement", () => {
  assert.equal(formatPaymentMethod("card"), "Carte");
  assert.equal(formatPaymentMethod("cheque"), "Chèque");
  assert.equal(formatPaymentMethod(null), "Paiement");
  assert.equal(isManualPaymentMethod("virement"), true);
  assert.equal(isManualPaymentMethod("card"), false);
});
