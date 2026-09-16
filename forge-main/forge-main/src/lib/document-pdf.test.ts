import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";

import { getClientFacingSpecifications, groupDocumentLines, renderBusinessDocumentPdf } from "./document-pdf";

test("groups any current, future or historical category without dropping lines", () => {
  const groups = groupDocumentLines([
    { lineType: "TYPE A", category: "A", label: "A", amountCents: 100 },
    { lineType: "TYPE B", category: "B", label: "B", amountCents: 200 },
    { lineType: "TYPE C", category: "C", label: "C", amountCents: 300 },
    { lineType: "ANCIEN TYPE SUPPRIMÉ", category: "Historique", label: "Historique", amountCents: 400 },
    { category: "", label: "Générique", amountCents: 500 },
  ]);
  assert.deepEqual(groups.map((group) => group.label), ["TYPE A", "TYPE B", "TYPE C", "ANCIEN TYPE SUPPRIMÉ", "Autre"]);
  assert.equal(groups.flatMap((group) => group.lines).length, 5);
});

test("keeps client-facing material facts and rejects internal economics", () => {
  assert.deepEqual(getClientFacingSpecifications({ puissance: "1500 W", orientation: "Vertical", purchaseCost: "50", marge: "30 %", fournisseur: "Interne" }), ["puissance: 1500 W", "orientation: Vertical"]);
});

test("renders a valid multipage document with repeated table structure", async () => {
  const bytes = await renderBusinessDocumentPdf({
    kindLabel: "DEVIS",
    reference: "D2026-000001",
    issuerLines: ["Entreprise Test", "1 rue de Paris", "SIRET 123"],
    clientLines: ["Client Test"],
    metadata: [{ label: "Date", value: "16 septembre 2026" }],
    title: "Document long",
    lines: Array.from({ length: 35 }, (_, index) => ({
      category: index % 3 === 0 ? "TYPE A" : index % 3 === 1 ? "TYPE B" : "TYPE C",
      label: `Ligne professionnelle très détaillée numéro ${index + 1}`,
      quantityMilli: 1000,
      unit: "u",
      unitPriceCents: 10000,
      amountCents: 10000,
      vatRateBp: 2000,
      details: [{ label: "Détail", description: "Description client suffisamment longue pour vérifier le retour à la ligne." }],
    })),
    summaryRows: [{ label: "TOTAL TTC", value: "4 200 EUR", emphasized: true }],
  });
  const parsed = await PDFDocument.load(bytes);
  assert.ok(parsed.getPageCount() >= 2);
});
