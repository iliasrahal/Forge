import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanQuotePublicToken,
  createQuotePublicToken,
  getQuoteAcceptanceState,
  hashQuotePublicToken,
} from "./quote-public-access";

test("génère un token cryptographique long et ne conserve qu'un hash", () => {
  const token = createQuotePublicToken();
  assert.ok(token.length >= 40);
  assert.notEqual(hashQuotePublicToken(token), token);
  assert.equal(hashQuotePublicToken(token).length, 64);
});

test("un token modifié produit un autre hash", () => {
  const token = createQuotePublicToken();
  const modified = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
  assert.notEqual(hashQuotePublicToken(token), hashQuotePublicToken(modified));
});

test("refuse les tokens inventés au format invalide", () => {
  assert.equal(cleanQuotePublicToken("court"), null);
  assert.equal(cleanQuotePublicToken("token avec espace"), null);
});

test("autorise uniquement ENVOYE et traite ACCEPTE comme idempotent", () => {
  assert.equal(getQuoteAcceptanceState("ENVOYE").canAccept, true);
  assert.equal(getQuoteAcceptanceState("ACCEPTE").alreadyAccepted, true);
  assert.equal(getQuoteAcceptanceState("BROUILLON").canAccept, false);
  assert.equal(getQuoteAcceptanceState("REFUSE").canAccept, false);
});
