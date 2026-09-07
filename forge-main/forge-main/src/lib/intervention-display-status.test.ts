import assert from "node:assert/strict";
import test from "node:test";

import {
  formatInterventionDisplayStatus,
  getInterventionDisplayStatus,
  isInterventionDatePast,
} from "./intervention-display-status";
import { parseParisDateTime } from "./paris-datetime";

const now = new Date("2026-09-06T22:30:00.000Z"); // 7 septembre à Paris

function parisDate(dateKey: string) {
  const date = parseParisDateTime(dateKey, "09:00");
  assert.ok(date);
  return date;
}

test("une intervention planifiée avant aujourd’hui est affichée comme passée", () => {
  const displayStatus = getInterventionDisplayStatus(
    "PLANIFIEE",
    parisDate("2026-09-06"),
    now,
  );

  assert.equal(displayStatus, "PASSEE");
  assert.equal(formatInterventionDisplayStatus(displayStatus), "Passée");
});

test("la comparaison porte sur la date civile et non sur l’heure", () => {
  assert.equal(isInterventionDatePast("2026-09-06", "2026-09-07"), true);
  assert.equal(isInterventionDatePast("2026-09-07", "2026-09-07"), false);
  assert.equal(isInterventionDatePast("2026-09-08", "2026-09-07"), false);
});

test("une intervention planifiée aujourd’hui reste planifiée quelle que soit son heure", () => {
  assert.equal(
    getInterventionDisplayStatus(
      "PLANIFIEE",
      parisDate("2026-09-07"),
      now,
    ),
    "PLANIFIEE",
  );
});

test("une intervention planifiée dans le futur reste planifiée", () => {
  assert.equal(
    getInterventionDisplayStatus(
      "PLANIFIEE",
      parisDate("2026-09-08"),
      now,
    ),
    "PLANIFIEE",
  );
});

test("les statuts métier ne sont jamais remplacés par passée", () => {
  const oldDate = parisDate("2026-09-06");

  assert.equal(getInterventionDisplayStatus("EN_COURS", oldDate, now), "EN_COURS");
  assert.equal(getInterventionDisplayStatus("TERMINEE", oldDate, now), "TERMINEE");
  assert.equal(getInterventionDisplayStatus("ANNULEE", oldDate, now), "ANNULEE");
});
