import assert from "node:assert/strict";
import test from "node:test";

import { buildDocumentLinesFromForm } from "@/src/lib/document-lines";
import { emptyQuoteLine, placeMaterialInDocumentLines } from "@/src/lib/quote-lines";
import { buildInvoiceSnapshotFromQuote } from "@/src/lib/quote-invoice-snapshot";

test("le snapshot matériel est figé du formulaire au devis puis à la facture", () => {
  const [line] = buildDocumentLinesFromForm(JSON.stringify([{ category: "Circulateur", quantity: "1", unit: "u", unitPrice: "139", cost: "89", discount: "", material: { catalogItemId: "catalog-1", workspaceMaterialId: "workspace-1", name: "Circulateur 25-60", brand: "Forge Test", reference: "FT-CIRC-25-60", specifications: { diameter: "25" }, supplier: "Test" } }]), 2000);
  assert.equal(line.materialReference, "FT-CIRC-25-60");
  const invoice = buildInvoiceSnapshotFromQuote({ title: "Test", description: null, amountCents: 13900, vatApplicable: true, totalHtCents: 13900, totalVatCents: 2780, discountBp: 0, totalCostCents: 8900, lines: [line] });
  assert.equal(invoice.lines[0].materialReference, "FT-CIRC-25-60");
  assert.deepEqual(invoice.lines[0].materialSpecifications, { diameter: "25" });
});

test("place le matériel sélectionné dans la ligne Matériel existante", () => {
  const lines = [emptyQuoteLine("Main d'œuvre"), emptyQuoteLine("Matériel"), emptyQuoteLine("Déplacement")];
  const updated = placeMaterialInDocumentLines(lines, {
    catalogItemId: "catalog-1", workspaceMaterialId: null, name: "Radiateur vertical", brand: "", reference: "",
    specifications: { orientation: "vertical" }, supplier: "", salePriceCents: 0, purchasePriceCents: null, unit: "u",
  });
  assert.equal(updated.length, 3);
  assert.equal(updated[1].category, "Matériel");
  assert.equal(updated[1].material?.name, "Radiateur vertical");
  assert.equal(updated[0].category, "Main d'œuvre");
  assert.equal(updated[2].category, "Déplacement");
});
