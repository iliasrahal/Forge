import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidClientEmail,
  normalizeClientEmail,
  resolveClientEmail,
  resolveStoredOrProvidedClientEmail,
} from "./client-email";

test("normalise et valide une adresse client enregistrée", () => {
  assert.equal(normalizeClientEmail("  Jean@Exemple.FR "), "jean@exemple.fr");
  assert.equal(isValidClientEmail("jean@exemple.fr"), true);
});

test("utilise d'abord l'adresse explicite puis celle du client", () => {
  assert.equal(
    resolveClientEmail({
      explicitEmail: "nouvelle@exemple.fr",
      clientEmail: "ancienne@exemple.fr",
    }),
    "nouvelle@exemple.fr",
  );
  assert.equal(
    resolveClientEmail({ clientEmail: "client@exemple.fr" }),
    "client@exemple.fr",
  );
});

test("refuse une adresse absente ou invalide", () => {
  assert.equal(resolveClientEmail({ clientEmail: "adresse-invalide" }), null);
  assert.equal(resolveClientEmail({}), null);
});

test("conserve l'adresse enregistrée ou prépare la sauvegarde d'une nouvelle adresse", () => {
  assert.deepEqual(
    resolveStoredOrProvidedClientEmail({
      clientEmail: "client@exemple.fr",
      explicitEmail: "autre@exemple.fr",
    }),
    { recipientEmail: "client@exemple.fr", shouldPersist: false },
  );
  assert.deepEqual(
    resolveStoredOrProvidedClientEmail({
      clientEmail: null,
      explicitEmail: " Nouveau@Exemple.FR ",
    }),
    { recipientEmail: "nouveau@exemple.fr", shouldPersist: true },
  );
});
