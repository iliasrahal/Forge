import assert from "node:assert/strict";
import test from "node:test";
import { allocationAmount, normalizePurchaseLines, purchaseTotals } from "./purchases";

test("calcule un achat multi-lignes sans flottants monétaires", () => {
  const lines = normalizePurchaseLines([
    { name: "Raccord", quantity: "10", unitPrice: "3,20", vatRate: "20" },
    { name: "Groupe de sécurité", quantity: 1, unitPrice: 28, vatRate: 20 },
  ]);
  assert.deepEqual(purchaseTotals(lines), { netAmountCents: 6000, vatAmountCents: 1200, totalAmountCents: 7200 });
});

test("accepte une ligne libre sans référence catalogue", () => {
  const [line] = normalizePurchaseLines([{ name: "Parking", lineType: "OTHER", quantity: 1, unitPrice: 12 }]);
  assert.equal(line.materialCatalogItemId, null);
  assert.equal(line.workspaceMaterialId, null);
});

test("calcule une affectation partielle au coût unitaire historique", () => {
  assert.equal(allocationAmount(8000, 300), 2400);
});
