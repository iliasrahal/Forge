import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTradeSlugs } from "./trades";

test("normalise plusieurs métiers sans doublon", () => {
  assert.deepEqual(normalizeTradeSlugs(["Plomberie", "chauffage", "plomberie", "inconnu"]), ["plomberie", "chauffage"]);
});
