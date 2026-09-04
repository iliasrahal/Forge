import assert from "node:assert/strict";
import test from "node:test";

import {
  matchCatalogServicesForQuote,
  parseSerializedQuoteLines,
  serializeQuoteLines,
} from "./quote-catalog-matching";

const services = [
  { id: "travel", name: "Déplacement", priceCents: 4500 },
  { id: "leak", name: "Recherche de fuite", priceCents: 9000 },
  { id: "tap", name: "Remplacement robinet", priceCents: 12000 },
  { id: "labor", name: "Main d'œuvre", priceCents: 6000 },
];

const line = (category: string, unitPrice: string) => ({
  category,
  quantity: "1",
  unit: "forfait",
  unitPrice,
  discount: "",
  cost: "",
});

test("reconnaît une prestation claire et utilise son tarif catalogue", () => {
  assert.deepEqual(
    matchCatalogServicesForQuote("Fais un devis avec recherche de fuite.", services),
    [line("Recherche de fuite", "90.00")],
  );
});

test("reconnaît plusieurs prestations et conserve l'ordre de la demande", () => {
  assert.deepEqual(
    matchCatalogServicesForQuote(
      "Devis avec déplacement, recherche de fuite et main d'œuvre.",
      services,
    ),
    [
      line("Déplacement", "45.00"),
      line("Recherche de fuite", "90.00"),
      line("Main d'œuvre", "60.00"),
    ],
  );
});

test("tolère les mots de liaison sans faire de rapprochement approximatif", () => {
  assert.deepEqual(
    matchCatalogServicesForQuote("Prévoir le remplacement du robinet.", services),
    [line("Remplacement robinet", "120.00")],
  );
  assert.deepEqual(
    matchCatalogServicesForQuote("Prévoir le remplacement du circulateur.", services),
    [],
  );
});

test("garde uniquement les prestations connues dans une demande mixte", () => {
  assert.deepEqual(
    matchCatalogServicesForQuote(
      "Devis avec déplacement et remplacement d'un circulateur.",
      services,
    ),
    [line("Déplacement", "45.00")],
  );
});

test("un prix explicitement placé après la prestation remplace le snapshot", () => {
  assert.deepEqual(
    matchCatalogServicesForQuote("Devis avec déplacement à 30 €.", services),
    [line("Déplacement", "30.00")],
  );
  assert.equal(services[0].priceCents, 4500);
});

test("un catalogue vide préserve l'ancien comportement sans ligne injectée", () => {
  assert.deepEqual(matchCatalogServicesForQuote("Devis avec déplacement.", []), []);
});

test("sérialise puis valide les snapshots transmis au formulaire", () => {
  const lines = [line("Déplacement", "45.00")];
  assert.deepEqual(parseSerializedQuoteLines(serializeQuoteLines(lines)), lines);
  assert.deepEqual(parseSerializedQuoteLines("not-json"), []);
  assert.deepEqual(
    parseSerializedQuoteLines('[{"category":"X","unitPrice":"prix"}]'),
    [],
  );
});

test("tolère l'ancien champ 'amount' des liens transitoires", () => {
  assert.deepEqual(
    parseSerializedQuoteLines('[{"category":"Déplacement","amount":"45,00"}]'),
    [line("Déplacement", "45.00")],
  );
});

test("conserve quantité, unité, remise et coût quand ils sont fournis", () => {
  const rich = {
    category: "Pose carrelage",
    quantity: "12,5",
    unit: "m2",
    unitPrice: "38.00",
    discount: "10",
    cost: "22.00",
    vatRateBp: 1000,
  };
  assert.deepEqual(parseSerializedQuoteLines(JSON.stringify([rich])), [
    { ...rich, quantity: "12.5" },
  ]);
});
