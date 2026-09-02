import assert from "node:assert/strict";
import test from "node:test";

import {
  buildQuoteSignatureSnapshot,
  createQuoteIntegrityHash,
  validateDrawnSignature,
  validateSignerName,
} from "./quote-signature";

const validSignature = { version: 1, strokes: [[[0.1, 0.2], [0.4, 0.5], [0.8, 0.3]]] };

test("valide une signature manuscrite compacte", () => {
  assert.equal(validateDrawnSignature(validSignature).error, null);
});

test("refuse une signature vide ou trop courte", () => {
  assert.match(validateDrawnSignature({ version: 1, strokes: [] }).error ?? "", /obligatoire/);
  assert.match(validateDrawnSignature({ version: 1, strokes: [[[0.1, 0.1], [0.1001, 0.1001]]] }).error ?? "", /courte/);
});

test("refuse une signature trop volumineuse", () => {
  const points = Array.from({ length: 3_001 }, (_, index) => [index / 3_001, 0.5]);
  assert.match(validateDrawnSignature({ version: 1, strokes: [points] }).error ?? "", /volumineuse/);
});

test("valide séparément prénom et nom", () => {
  assert.match(validateSignerName("", "Le prénom").error ?? "", /obligatoire/);
  assert.match(validateSignerName("", "Le nom").error ?? "", /obligatoire/);
  assert.equal(validateSignerName("  Jean  ", "Le prénom").value, "Jean");
});

test("le hash rattache le contenu, le signataire et l'instant", () => {
  const snapshot = buildQuoteSignatureSnapshot({
    reference: "DEV-001", title: "Fuite", description: "Réparation", amountCents: 84000,
    organization: { name: "Forge" },
    client: { type: "PARTICULIER", firstName: "Jean", lastName: "Dupont", companyName: null, phone: null, email: null, street: null, postalCode: null, city: null },
    lines: [{ category: "Travaux", label: "Réparation", amountCents: 84000 }],
  });
  const signedAt = new Date("2026-09-02T13:00:00.000Z");
  const first = createQuoteIntegrityHash({ snapshot, signerFirstName: "Jean", signerLastName: "Dupont", signedAt });
  const second = createQuoteIntegrityHash({ snapshot: { ...snapshot, amountCents: 85000 }, signerFirstName: "Jean", signerLastName: "Dupont", signedAt });
  assert.equal(first.length, 64);
  assert.notEqual(first, second);
});
