import assert from "node:assert/strict";
import test from "node:test";

import { getQuoteIssuer } from "./quote-issuer";

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
      phone: "0612345678",
      email: "contact@example.fr",
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
      phone: "0612345678",
      email: "contact@example.fr",
    },
  );
});
