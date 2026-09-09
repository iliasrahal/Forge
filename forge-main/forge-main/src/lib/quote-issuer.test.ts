import assert from "node:assert/strict";
import test from "node:test";

import { getQuoteIssuer, getQuoteIssuerLines } from "./quote-issuer";

const owner = {
  firstName: "Mohamed",
  lastName: "Martin",
  companyName: "Atelier Martin",
  email: "contact@example.fr",
  phone: "0612345678",
};

test("utilise le propriétaire du workspace personnel", () => {
  assert.deepEqual(
    getQuoteIssuer({
      name: "Espace personnel",
      type: "PERSONAL",
      personalOwner: owner,
      members: [],
    }),
    {
      companyName: "Atelier Martin",
      fullName: "Mohamed Martin",
      street: null,
      cityLine: null,
      phone: "0612345678",
      email: "contact@example.fr",
      siret: null,
      vatNumber: null,
      apeCode: null,
    },
  );
});

test("utilise le nom et le responsable du workspace équipe", () => {
  assert.equal(
    getQuoteIssuer({
      name: "Empire",
      type: "TEAM",
      personalOwner: null,
      members: [{ user: owner }],
    }).companyName,
    "Empire",
  );
});

test("omet proprement les informations absentes", () => {
  assert.deepEqual(
    getQuoteIssuer({
      name: "Espace personnel",
      type: "PERSONAL",
      personalOwner: { ...owner, lastName: null, companyName: null },
      members: [],
    }),
    {
      companyName: null,
      fullName: "Mohamed",
      street: null,
      cityLine: null,
      phone: "0612345678",
      email: "contact@example.fr",
      siret: null,
      vatNumber: null,
      apeCode: null,
    },
  );
});

test("privilégie l'identité de l'entreprise et la reprend dans les lignes émetteur", () => {
  const organization = {
    name: "Espace personnel",
    type: "PERSONAL" as const,
    legalName: "SARL Martin Bâtiment",
    siret: "12345678900012",
    vatNumber: "FR12345678900",
    apeCode: "4321A",
    addressStreet: "12 rue des Artisans",
    addressPostalCode: "75011",
    addressCity: "Paris",
    contactPhone: "0102030405",
    contactEmail: "devis@martin-batiment.fr",
    personalOwner: owner,
    members: [],
  };

  assert.deepEqual(getQuoteIssuer(organization), {
    companyName: "SARL Martin Bâtiment",
    fullName: "Mohamed Martin",
    street: "12 rue des Artisans",
    cityLine: "75011 Paris",
    phone: "0102030405",
    email: "devis@martin-batiment.fr",
    siret: "12345678900012",
    vatNumber: "FR12345678900",
    apeCode: "4321A",
  });

  assert.deepEqual(getQuoteIssuerLines(organization), [
    "SARL Martin Bâtiment",
    "Mohamed Martin",
    "12 rue des Artisans",
    "75011 Paris",
    "0102030405",
    "devis@martin-batiment.fr",
    "SIRET 12345678900012",
    "TVA FR12345678900",
    "APE 4321A",
  ]);
});
