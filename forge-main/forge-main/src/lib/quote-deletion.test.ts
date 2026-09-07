import assert from "node:assert/strict";
import test from "node:test";

import { getQuoteDeletionBlockReason } from "./quote-deletion";

const draft = {
  status: "BROUILLON" as const,
  invoiceCount: 0,
  publicAccessCount: 0,
  reminderCount: 0,
  hasSignature: false,
};

test("autorise un brouillon sans dépendance", () => {
  assert.equal(getQuoteDeletionBlockReason(draft), null);
});

test("bloque un devis lié à une facture", () => {
  assert.match(
    getQuoteDeletionBlockReason({ ...draft, invoiceCount: 1 }) ?? "",
    /facture/i,
  );
});

test("bloque les devis envoyés, acceptés, refusés ou signés", () => {
  for (const status of ["ENVOYE", "ACCEPTE", "REFUSE"] as const) {
    assert.notEqual(
      getQuoteDeletionBlockReason({ ...draft, status }),
      null,
    );
  }
  assert.notEqual(
    getQuoteDeletionBlockReason({ ...draft, hasSignature: true }),
    null,
  );
});

test("bloque un brouillon possédant déjà une trace d’envoi", () => {
  assert.notEqual(
    getQuoteDeletionBlockReason({ ...draft, publicAccessCount: 1 }),
    null,
  );
  assert.notEqual(
    getQuoteDeletionBlockReason({ ...draft, reminderCount: 1 }),
    null,
  );
});
