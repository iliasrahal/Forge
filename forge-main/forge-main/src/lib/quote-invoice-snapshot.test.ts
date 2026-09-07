import assert from "node:assert/strict";
import test from "node:test";

import { buildInvoiceSnapshotFromQuote } from "./quote-invoice-snapshot";

test("copie toutes les données tarifaires sans partager les lignes", () => {
  const quote = {
    title: "Travaux",
    description: null,
    amountCents: 24000,
    vatApplicable: true,
    totalHtCents: 21000,
    totalVatCents: 3000,
    discountBp: 500,
    totalCostCents: 9000,
    lines: [{ id: "quote-line-1", quoteId: "quote-1", createdAt: new Date(), category: "Main d'œuvre", label: "Main d'œuvre", quantityMilli: 2000, unit: "h", unitPriceCents: 5000, costCents: 2000, discountBp: 0, amountCents: 10000, vatRateBp: 1000 }],
  };
  const snapshot = buildInvoiceSnapshotFromQuote(quote);
  assert.deepEqual(snapshot.lines, [{ category: "Main d'œuvre", label: "Main d'œuvre", quantityMilli: 2000, unit: "h", unitPriceCents: 5000, costCents: 2000, discountBp: 0, amountCents: 10000, vatRateBp: 1000 }]);
  assert.notEqual(snapshot.lines, quote.lines);
  assert.equal("id" in snapshot.lines[0], false);
  assert.equal("quoteId" in snapshot.lines[0], false);
  assert.equal("createdAt" in snapshot.lines[0], false);
  snapshot.lines[0].unitPriceCents = 12000;
  assert.equal(quote.lines[0].unitPriceCents, 5000);
  assert.equal(snapshot.vatApplicable, true);
  assert.equal(snapshot.discountBp, 500);
});
