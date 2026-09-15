import assert from "node:assert/strict";
import test from "node:test";

import { buildDocumentLinesFromForm } from "@/src/lib/document-lines";
import { buildInvoiceSnapshotFromQuote } from "@/src/lib/quote-invoice-snapshot";

test("le snapshot matériel est figé du formulaire au devis puis à la facture", () => {
  const [line] = buildDocumentLinesFromForm(JSON.stringify([{ category: "Circulateur", quantity: "1", unit: "u", unitPrice: "139", cost: "89", discount: "", material: { catalogItemId: "catalog-1", workspaceMaterialId: "workspace-1", name: "Circulateur 25-60", brand: "Forge Test", reference: "FT-CIRC-25-60", specifications: { diameter: "25" }, supplier: "Test" } }]), 2000);
  assert.equal(line.materialReference, "FT-CIRC-25-60");
  const invoice = buildInvoiceSnapshotFromQuote({ title: "Test", description: null, amountCents: 13900, vatApplicable: true, totalHtCents: 13900, totalVatCents: 2780, discountBp: 0, totalCostCents: 8900, lines: [line] });
  assert.equal(invoice.lines[0].materialReference, "FT-CIRC-25-60");
  assert.deepEqual(invoice.lines[0].materialSpecifications, { diameter: "25" });
});
