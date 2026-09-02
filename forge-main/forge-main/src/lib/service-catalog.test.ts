import assert from "node:assert/strict";
import test from "node:test";

import { parseEuroPriceToCents, validateServiceCatalogInput } from "./service-catalog";

test("convertit précisément les prix décimaux en centimes", () => {
  assert.equal(parseEuroPriceToCents("45"), 4500);
  assert.equal(parseEuroPriceToCents("60,50"), 6050);
  assert.equal(parseEuroPriceToCents("120.09"), 12009);
});

test("refuse les prix invalides", () => {
  assert.equal(parseEuroPriceToCents("0"), null);
  assert.equal(parseEuroPriceToCents("12,345"), null);
  assert.equal(parseEuroPriceToCents("prix"), null);
});

test("valide les champs obligatoires et le type de prix", () => {
  assert.equal(validateServiceCatalogInput({ price: "10", pricingType: "FIXED" }).ok, false);
  assert.equal(validateServiceCatalogInput({ name: "Déplacement", price: "10", pricingType: "OTHER" }).ok, false);
  assert.deepEqual(
    validateServiceCatalogInput({
      name: " Déplacement ",
      description: " Zone locale ",
      price: "45,00",
      pricingType: "FIXED",
    }),
    {
      ok: true,
      data: {
        name: "Déplacement",
        description: "Zone locale",
        priceCents: 4500,
        pricingType: "FIXED",
      },
    },
  );
});
