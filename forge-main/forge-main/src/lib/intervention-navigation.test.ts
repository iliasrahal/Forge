import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInterventionHref,
  getInterventionReturnHref,
} from "./intervention-navigation";

test("conserve le contexte d'ouverture d'une intervention", () => {
  assert.equal(
    buildInterventionHref("intervention-1", "planning"),
    "/interventions/intervention-1?from=planning",
  );
  assert.equal(
    buildInterventionHref("intervention-1", "client", "client-1"),
    "/interventions/intervention-1?from=client&clientId=client-1",
  );
});

test("résout un retour interne sûr avec un fallback vers l'accueil", () => {
  assert.equal(getInterventionReturnHref({ context: "planning" }), "/app?planning=1");
  assert.equal(getInterventionReturnHref({ context: "history" }), "/history");
  assert.equal(getInterventionReturnHref({ context: "home" }), "/app");
  assert.equal(getInterventionReturnHref({ context: "external" }), "/app");
});

test("ne revient au client que si celui-ci appartient réellement à l'intervention", () => {
  assert.equal(
    getInterventionReturnHref({
      context: "client",
      requestedClientId: "client-1",
      interventionClientId: "client-1",
    }),
    "/clients/client-1",
  );
  assert.equal(
    getInterventionReturnHref({
      context: "client",
      requestedClientId: "client-2",
      interventionClientId: "client-1",
    }),
    "/app",
  );
});
