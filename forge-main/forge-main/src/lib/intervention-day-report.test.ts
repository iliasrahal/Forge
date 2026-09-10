import assert from "node:assert/strict";
import test from "node:test";

import { formatInterventionDayReport, parseInterventionDayReport } from "./intervention-day-report";

test("restaure un compte rendu journalier structuré", () => {
  const stored = JSON.stringify({ intervention: "Pose", diagnostic: "RAS", travaux: "Fixation", recommandation: "Contrôle" });
  assert.deepEqual(parseInterventionDayReport(stored), {
    intervention: "Pose",
    diagnostic: "RAS",
    travaux: "Fixation",
    recommandation: "Contrôle",
  });
  assert.equal(formatInterventionDayReport(stored), "Pose · RAS · Fixation · Contrôle");
});

test("conserve la compatibilité avec un ancien rapport texte", () => {
  assert.equal(parseInterventionDayReport("Ancien rapport")?.intervention, "Ancien rapport");
});
