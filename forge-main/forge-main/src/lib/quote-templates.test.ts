import assert from "node:assert/strict";
import test from "node:test";

import { templateLinesToEditable } from "./quote-templates";

test("templateLinesToEditable : formate quantité, prix, remise, coût", () => {
  const editable = templateLinesToEditable([
    {
      category: "Main d'œuvre",
      label: "Pose carrelage",
      quantityMilli: 2500,
      unit: "m2",
      unitPriceCents: 4500,
      costCents: 2000,
      discountBp: 1000,
      vatRateBp: 1000,
    },
    {
      category: "Déplacement",
      label: null,
      quantityMilli: 1000,
      unit: "forfait",
      unitPriceCents: 3500,
      costCents: null,
      discountBp: 0,
      vatRateBp: 2000,
    },
  ]);

  assert.deepEqual(editable[0], {
    category: "Pose carrelage",
    quantity: "2.5",
    unit: "m2",
    unitPrice: "45.00",
    discount: "10",
    cost: "20.00",
    vatRateBp: 1000,
    details: [],
  });
  assert.deepEqual(editable[1], {
    category: "Déplacement",
    quantity: "1",
    unit: "forfait",
    unitPrice: "35.00",
    discount: "",
    cost: "",
    vatRateBp: 2000,
    details: [],
  });
});
