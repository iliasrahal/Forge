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

test("reconnaît une prestation claire et utilise son tarif catalogue", () => {
  assert.deepEqual(
    matchCatalogServicesForQuote("Fais un devis avec recherche de fuite.", services),
    [{ category: "Recherche de fuite", amount: "90.00" }],
  );
});

test("reconnaît plusieurs prestations et conserve l'ordre de la demande", () => {
  assert.deepEqual(
    matchCatalogServicesForQuote(
      "Devis avec déplacement, recherche de fuite et main d'œuvre.",
      services,
    ),
    [
      { category: "Déplacement", amount: "45.00" },
      { category: "Recherche de fuite", amount: "90.00" },
      { category: "Main d'œuvre", amount: "60.00" },
    ],
  );
});

test("tolère les mots de liaison sans faire de rapprochement approximatif", () => {
  assert.deepEqual(
    matchCatalogServicesForQuote("Prévoir le remplacement du robinet.", services),
    [{ category: "Remplacement robinet", amount: "120.00" }],
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
    [{ category: "Déplacement", amount: "45.00" }],
  );
});

test("un prix explicitement placé après la prestation remplace le snapshot", () => {
  assert.deepEqual(
    matchCatalogServicesForQuote("Devis avec déplacement à 30 €.", services),
    [{ category: "Déplacement", amount: "30.00" }],
  );
  assert.equal(services[0].priceCents, 4500);
});

test("un catalogue vide préserve l'ancien comportement sans ligne injectée", () => {
  assert.deepEqual(matchCatalogServicesForQuote("Devis avec déplacement.", []), []);
});

test("sérialise puis valide les snapshots transmis au formulaire", () => {
  const lines = [{ category: "Déplacement", amount: "45.00" }];
  assert.deepEqual(parseSerializedQuoteLines(serializeQuoteLines(lines)), lines);
  assert.deepEqual(parseSerializedQuoteLines("not-json"), []);
  assert.deepEqual(
    parseSerializedQuoteLines('[{"category":"X","amount":"prix"}]'),
    [],
  );
});
