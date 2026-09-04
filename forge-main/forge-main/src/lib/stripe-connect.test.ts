import assert from "node:assert/strict";
import test from "node:test";

import { connectStatusFromFlags } from "./stripe-connect";

test("connectStatusFromFlags : aucun compte", () => {
  assert.equal(
    connectStatusFromFlags({
      stripeAccountId: null,
      stripeChargesEnabled: false,
      stripeDetailsSubmitted: false,
    }),
    "none",
  );
});

test("connectStatusFromFlags : compte créé, onboarding non terminé", () => {
  assert.equal(
    connectStatusFromFlags({
      stripeAccountId: "acct_1",
      stripeChargesEnabled: false,
      stripeDetailsSubmitted: false,
    }),
    "pending",
  );
});

test("connectStatusFromFlags : dossier soumis mais encaissements bloqués", () => {
  assert.equal(
    connectStatusFromFlags({
      stripeAccountId: "acct_1",
      stripeChargesEnabled: false,
      stripeDetailsSubmitted: true,
    }),
    "restricted",
  );
});

test("connectStatusFromFlags : actif dès que les encaissements sont ouverts", () => {
  assert.equal(
    connectStatusFromFlags({
      stripeAccountId: "acct_1",
      stripeChargesEnabled: true,
      stripeDetailsSubmitted: true,
    }),
    "active",
  );
});
