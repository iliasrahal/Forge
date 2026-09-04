import assert from "node:assert/strict";
import test from "node:test";

import { createQuoteLineSnapshot, emptyQuoteLine } from "./quote-lines";

test("copie le nom et le prix courant dans une ligne indépendante", () => {
  const service = { name: "Recherche de fuite", priceCents: 9000 };
  const line = createQuoteLineSnapshot(service);

  service.name = "Recherche de fuite complète";
  service.priceCents = 10000;

  assert.deepEqual(line, {
    category: "Recherche de fuite",
    quantity: "1",
    unit: "forfait",
    unitPrice: "90.00",
    discount: "",
    cost: "",
  });
});

test("createQuoteLineSnapshot fige le taux de TVA par défaut fourni", () => {
  const line = createQuoteLineSnapshot(
    { name: "Pose", priceCents: 12000 },
    550,
  );
  assert.equal(line.vatRateBp, 550);
  assert.equal(line.unitPrice, "120.00");
});

test("emptyQuoteLine : une ligne vierge exploitable", () => {
  assert.deepEqual(emptyQuoteLine("Matériel"), {
    category: "Matériel",
    quantity: "1",
    unit: "forfait",
    unitPrice: "",
    discount: "",
    cost: "",
  });
});
