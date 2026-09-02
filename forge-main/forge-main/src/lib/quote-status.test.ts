import assert from "node:assert/strict";
import test from "node:test";

import { canTransitionQuoteStatus, isQuoteContractLocked } from "./quote-status";

test("un devis accepté ne revient pas vers un état antérieur", () => {
  assert.equal(canTransitionQuoteStatus("ACCEPTE", "BROUILLON"), false);
  assert.equal(canTransitionQuoteStatus("ACCEPTE", "ENVOYE"), false);
  assert.equal(canTransitionQuoteStatus("ACCEPTE", "ACCEPTE"), true);
});

test("un devis refusé ne devient pas accepté silencieusement", () => {
  assert.equal(canTransitionQuoteStatus("REFUSE", "ACCEPTE"), false);
  assert.equal(canTransitionQuoteStatus("REFUSE", "REFUSE"), true);
});

test("un devis accepté, y compris historique sans signature, est verrouillé", () => {
  assert.equal(isQuoteContractLocked("ACCEPTE", false), true);
  assert.equal(isQuoteContractLocked("ENVOYE", true), true);
  assert.equal(isQuoteContractLocked("ENVOYE", false), false);
});
