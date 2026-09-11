import assert from "node:assert/strict";
import test from "node:test";

import {
  getQuoteClientName,
  getQuoteEditPath,
  getQuoteInterventionPath,
  getQuotePath,
} from "./quote-routes";

test("un devis sans client utilise une route stable et consultable", () => {
  assert.equal(
    getQuotePath({ id: "quote-1", clientId: null }),
    "/clients/sans-client/quotes/quote-1",
  );
  assert.equal(
    getQuoteEditPath({ id: "quote-1", clientId: null }),
    "/clients/sans-client/quotes/quote-1/edit",
  );
});

test("un devis sans client peut ouvrir la création d'intervention", () => {
  assert.equal(
    getQuoteInterventionPath({ id: "quote-1", clientId: null, title: "Salle de bain" }),
    "/clients/sans-client/interventions/new?title=Salle+de+bain&quoteId=quote-1",
  );
});

test("un devis rattaché conserve ses routes client historiques", () => {
  assert.equal(
    getQuotePath({ id: "quote-1", clientId: "client-1" }),
    "/clients/client-1/quotes/quote-1",
  );
});

test("le libellé client ne crée aucun faux client", () => {
  assert.equal(getQuoteClientName(null), "Aucun client associé");
  assert.equal(
    getQuoteClientName({
      type: "PARTICULIER",
      firstName: "Charles",
      lastName: "Xavier",
    }),
    "Charles Xavier",
  );
});
