import assert from "node:assert/strict";
import test from "node:test";
import { detectDeterministicForgeIntent } from "./forge-intent-router";

test("reconnaît les consultations statistiques sans appel LLM", () => {
  assert.equal(detectDeterministicForgeIntent("Combien j'ai encaissé ce mois-ci ?")?.metric, "collected");
  assert.equal(detectDeterministicForgeIntent("Combien me reste-t-il à encaisser ?")?.metric, "remaining");
  assert.equal(detectDeterministicForgeIntent("Quelle marge j'ai faite ?")?.metric, "margin");
});

test("distingue la rentabilité d’un chantier de la marge globale", () => {
  assert.deepEqual(detectDeterministicForgeIntent("Quelle marge j'ai sur le chantier Martin ?"), {
    intent: "profitability", action: "search", entity: "Martin",
  });
});

test("extrait une dette client et les affectations multiples", () => {
  assert.equal(detectDeterministicForgeIntent("Combien Charles me doit ?")?.entity, "Charles");
  assert.deepEqual(detectDeterministicForgeIntent("Ajoute Mohamed et Yanis au chantier Dupont")?.assignees, ["Mohamed", "Yanis"]);
});

test("extrait temps et achat structurés", () => {
  const time = detectDeterministicForgeIntent("Yanis a travaillé 4 heures sur Dupont");
  assert.equal(time?.durationMinutes, 240);
  assert.equal(time?.entity, "Dupont");
  const purchase = detectDeterministicForgeIntent("J'ai acheté 10 raccords chez Cédéo pour 32 €");
  assert.equal(purchase?.quantityMilli, 10000);
  assert.equal(purchase?.amountCents, 3200);
  assert.equal(purchase?.supplier, "Cédéo");
});
