import assert from "node:assert/strict";
import test from "node:test";

import { getBottomNavigationSection } from "./bottom-navigation";

test("les pages client restent dans Clients", () => {
  assert.equal(getBottomNavigationSection("/clients"), "clients");
  assert.equal(getBottomNavigationSection("/clients/client-1"), "clients");
  assert.equal(getBottomNavigationSection("/clients/client-1/edit"), "clients");
});

test("les devis imbriqués sous un client activent Devis", () => {
  assert.equal(
    getBottomNavigationSection("/clients/client-1/quotes/quote-1"),
    "quotes",
  );
  assert.equal(
    getBottomNavigationSection("/clients/client-1/quotes/quote-1/edit"),
    "quotes",
  );
  assert.equal(
    getBottomNavigationSection("/clients/client-1/quotes/new"),
    "quotes",
  );
});

test("les factures imbriquées sous un client activent Factures", () => {
  assert.equal(
    getBottomNavigationSection("/clients/client-1/invoices/new"),
    "invoices",
  );
});

test("les routes principales et leurs sous-pages gardent le bon onglet", () => {
  assert.equal(getBottomNavigationSection("/quotes/quote-1"), "quotes");
  assert.equal(getBottomNavigationSection("/quotes/quote-1/edit"), "quotes");
  assert.equal(getBottomNavigationSection("/invoices/invoice-1"), "invoices");
  assert.equal(getBottomNavigationSection("/invoices/invoice-1/edit"), "invoices");
  assert.equal(getBottomNavigationSection("/interventions/intervention-1"), "home");
  assert.equal(getBottomNavigationSection("/app"), "home");
});
