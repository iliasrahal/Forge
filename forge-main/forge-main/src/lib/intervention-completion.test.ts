import assert from "node:assert/strict";
import test from "node:test";

import { getInterventionReportState } from "./intervention-completion";

test("autorise une intervention terminée sans compte rendu", () => {
  assert.equal(
    getInterventionReportState({
      reportIntervention: null,
      reportDiagnostic: null,
      reportTravaux: null,
      reportRecommendation: null,
    }),
    "none",
  );
});

test("conserve la validation d'un compte rendu complet", () => {
  assert.equal(
    getInterventionReportState({
      reportIntervention: "Remplacement du robinet",
      reportDiagnostic: "Robinet défectueux",
      reportTravaux: "Robinet remplacé",
      reportRecommendation: "Surveiller l'étanchéité",
    }),
    "complete",
  );
});

test("refuse un compte rendu partiel", () => {
  assert.equal(
    getInterventionReportState({
      reportIntervention: "Remplacement du robinet",
      reportDiagnostic: null,
      reportTravaux: null,
      reportRecommendation: null,
    }),
    "incomplete",
  );
});
