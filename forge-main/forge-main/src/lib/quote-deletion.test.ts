import assert from "node:assert/strict";
import test from "node:test";

import { getQuoteDeletionPlan } from "./quote-deletion";

const quote = {
  status: "BROUILLON" as const,
  invoiceCount: 0,
  interventionCount: 0,
};

test("autorise la suppression quel que soit le statut", () => {
  for (const status of ["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE"] as const) {
    assert.equal(
      getQuoteDeletionPlan({ ...quote, status }).statusDoesNotBlockDeletion,
      true,
    );
  }
});

test("demande de détacher les documents métier liés", () => {
  assert.deepEqual(
    getQuoteDeletionPlan({
      ...quote,
      invoiceCount: 2,
      interventionCount: 1,
    }),
    {
      statusDoesNotBlockDeletion: true,
      detachInvoices: true,
      detachInterventions: true,
    },
  );
});
