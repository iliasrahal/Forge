import assert from "node:assert/strict";
import test from "node:test";

import { shouldAutoRefreshStatuses } from "./status-auto-refresh";

test("active la synchronisation sur les consultations devis et factures", () => {
  assert.equal(shouldAutoRefreshStatuses("/quotes"), true);
  assert.equal(shouldAutoRefreshStatuses("/quotes/stats"), true);
  assert.equal(shouldAutoRefreshStatuses("/invoices/invoice-1"), true);
  assert.equal(shouldAutoRefreshStatuses("/credit-notes/credit-1"), true);
  assert.equal(shouldAutoRefreshStatuses("/settings/paiement"), true);
  assert.equal(
    shouldAutoRefreshStatuses("/clients/client-1/quotes/quote-1"),
    true,
  );
});

test("active la synchronisation sur l'accueil et les fiches client", () => {
  assert.equal(shouldAutoRefreshStatuses("/app"), true);
  assert.equal(shouldAutoRefreshStatuses("/clients"), true);
  assert.equal(shouldAutoRefreshStatuses("/clients/client-1"), true);
  assert.equal(shouldAutoRefreshStatuses("/history"), true);
  assert.equal(shouldAutoRefreshStatuses("/interventions/intervention-1"), true);
});

test("protège les formulaires de création et modification", () => {
  assert.equal(shouldAutoRefreshStatuses("/quotes/new"), false);
  assert.equal(shouldAutoRefreshStatuses("/invoices/invoice-1/edit"), false);
  assert.equal(
    shouldAutoRefreshStatuses("/clients/client-1/quotes/quote-1/edit"),
    false,
  );
  assert.equal(
    shouldAutoRefreshStatuses("/clients/client-1/invoices/new"),
    false,
  );
  assert.equal(shouldAutoRefreshStatuses("/interventions/compte-rendu"), false);
});
