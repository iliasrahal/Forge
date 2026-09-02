import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateQuoteLinesTotal,
  createQuoteLineSnapshot,
} from "./quote-lines";

test("copie le nom et le prix courant dans une ligne indépendante", () => {
  const service = { name: "Recherche de fuite", priceCents: 9000 };
  const line = createQuoteLineSnapshot(service);

  service.name = "Recherche de fuite complète";
  service.priceCents = 10000;

  assert.deepEqual(line, { category: "Recherche de fuite", amount: "90.00" });
});

test("conserve exactement le calcul historique du total", () => {
  assert.equal(
    calculateQuoteLinesTotal([
      { category: "Déplacement", amount: "45" },
      { category: "Recherche", amount: "90,50" },
      { category: "Vide", amount: "" },
    ]),
    135.5,
  );
});
