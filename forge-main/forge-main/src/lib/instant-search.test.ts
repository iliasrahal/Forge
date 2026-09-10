import assert from "node:assert/strict";
import test from "node:test";

import { buildSearchText, matchesSearchText } from "./instant-search";

const documentSearch = buildSearchText([
  "Charles",
  "Xavier",
  "Charles Xavier",
  "Électricité Xavier",
  "Rénovation cuisine",
  "DEV-2026-0042",
]);

test("retrouve instantanément un client par nom complet", () => {
  assert.equal(matchesSearchText(documentSearch, "c"), true);
  assert.equal(matchesSearchText(documentSearch, "cha"), true);
  assert.equal(matchesSearchText(documentSearch, "CHARLES XAVIER"), true);
});

test("ignore les accents et la casse", () => {
  assert.equal(matchesSearchText(documentSearch, "electricite"), true);
  assert.equal(matchesSearchText(documentSearch, "RENOVATION"), true);
});

test("retrouve une référence et réaffiche tout avec une recherche vide", () => {
  assert.equal(matchesSearchText(documentSearch, "dev-2026-0042"), true);
  assert.equal(matchesSearchText(documentSearch, ""), true);
  assert.equal(matchesSearchText(documentSearch, "   "), true);
});
