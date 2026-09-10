import assert from "node:assert/strict";
import test from "node:test";

import { resolveDocumentEmailSignature } from "./document-email-signature";

test("conserve la signature personnelle dans un workspace personnel", () => {
  assert.equal(
    resolveDocumentEmailSignature(
      { type: "PERSONAL", name: "Personnel", legalName: "Entreprise ignorée" },
      { emailSignature: "Mohamed Martin\nArtisan", firstName: "Mohamed" },
    ),
    "Mohamed Martin\nArtisan",
  );
});

test("privilégie la raison sociale du workspace équipe", () => {
  assert.equal(
    resolveDocumentEmailSignature(
      { type: "TEAM", name: "Équipe Empire", legalName: "Empire Bâtiment SARL" },
      { emailSignature: "Signature du membre", firstName: "Mohamed" },
    ),
    "Empire Bâtiment SARL",
  );
});

test("utilise le nom de l'équipe puis la signature personnelle en repli", () => {
  assert.equal(
    resolveDocumentEmailSignature(
      { type: "TEAM", name: "Équipe Empire", legalName: "" },
      { emailSignature: "Signature du membre", firstName: "Mohamed" },
    ),
    "Équipe Empire",
  );

  assert.equal(
    resolveDocumentEmailSignature(
      { type: "TEAM", name: "", legalName: null },
      { emailSignature: "Signature du membre", firstName: "Mohamed" },
    ),
    "Signature du membre",
  );
});
