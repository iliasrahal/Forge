import assert from "node:assert/strict";
import test from "node:test";
import { parseFrenchInterventionRange } from "./french-intervention-range";

const now = new Date("2026-09-02T10:00:00.000Z");

test("comprend une plage du 10 au 15 septembre", () => {
  assert.deepEqual(parseFrenchInterventionRange("Chantier du 10 au 15 septembre", now), { scheduledDate: "2026-09-10", scheduledTime: null, scheduledEndDate: "2026-09-15", scheduledEndTime: null });
});

test("comprend une plage dont le mois est répété", () => {
  assert.deepEqual(parseFrenchInterventionRange("Du 10 septembre au 15 septembre", now), { scheduledDate: "2026-09-10", scheduledTime: null, scheduledEndDate: "2026-09-15", scheduledEndTime: null });
});

test("comprend une plage au format numérique", () => {
  assert.deepEqual(parseFrenchInterventionRange("Du 10/09 au 15/09", now), { scheduledDate: "2026-09-10", scheduledTime: null, scheduledEndDate: "2026-09-15", scheduledEndTime: null });
});

test("comprend les heures de début et de fin", () => {
  assert.deepEqual(parseFrenchInterventionRange("Du 10 septembre à 9h au 15 septembre à 17h", now), { scheduledDate: "2026-09-10", scheduledTime: "09:00", scheduledEndDate: "2026-09-15", scheduledEndTime: "17:00" });
});

test("comprend les heures lorsque le mois courant est implicite", () => {
  assert.deepEqual(parseFrenchInterventionRange("Du 10 à 9h au 15 à 17h", now), { scheduledDate: "2026-09-10", scheduledTime: "09:00", scheduledEndDate: "2026-09-15", scheduledEndTime: "17:00" });
});

test("comprend deux jours de semaine", () => {
  assert.deepEqual(parseFrenchInterventionRange("Intervention du lundi au vendredi", now), { scheduledDate: "2026-09-07", scheduledTime: null, scheduledEndDate: "2026-09-11", scheduledEndTime: null });
});

test("comprend les jours numérotés avec un mois partagé", () => {
  assert.deepEqual(parseFrenchInterventionRange("Du lundi 14 au vendredi 18 septembre", now), { scheduledDate: "2026-09-14", scheduledTime: null, scheduledEndDate: "2026-09-18", scheduledEndTime: null });
});

test("comprend une durée à partir de demain", () => {
  assert.deepEqual(parseFrenchInterventionRange("Chantier pendant 3 jours à partir de demain", now), { scheduledDate: "2026-09-03", scheduledTime: null, scheduledEndDate: "2026-09-05", scheduledEndTime: null });
});

test("comprend toute la semaine prochaine", () => {
  assert.deepEqual(parseFrenchInterventionRange("Chantier toute la semaine prochaine", now), { scheduledDate: "2026-09-07", scheduledTime: null, scheduledEndDate: "2026-09-11", scheduledEndTime: null });
});

test("comprend de lundi à vendredi", () => {
  assert.deepEqual(parseFrenchInterventionRange("Chantier de lundi à vendredi", now), { scheduledDate: "2026-09-07", scheduledTime: null, scheduledEndDate: "2026-09-11", scheduledEndTime: null });
});

for (const message of [
  "rdv aujourd'hui jusqu'au 20 septembre",
  "intervention aujourd'hui jusqu'au 20 septembre",
  "chantier aujourd'hui jusqu'au 20 septembre",
]) {
  test(`comprend la borne jusqu'au dans : ${message}`, () => {
    assert.deepEqual(parseFrenchInterventionRange(message, now), {
      scheduledDate: "2026-09-02",
      scheduledTime: null,
      scheduledEndDate: "2026-09-20",
      scheduledEndTime: null,
    });
  });
}

test("comprend demain jusqu'à vendredi", () => {
  assert.deepEqual(parseFrenchInterventionRange("chantier de demain jusqu'à vendredi", now), {
    scheduledDate: "2026-09-03",
    scheduledTime: null,
    scheduledEndDate: "2026-09-04",
    scheduledEndTime: null,
  });
});

test("comprend toute la semaine en partant du jour courant", () => {
  assert.deepEqual(parseFrenchInterventionRange("chantier toute la semaine", now), {
    scheduledDate: "2026-09-02",
    scheduledTime: null,
    scheduledEndDate: "2026-09-04",
    scheduledEndTime: null,
  });
});

test("comprend une période précédée d'un client", () => {
  assert.deepEqual(parseFrenchInterventionRange("chez Charles du 15 au 30 septembre", now), {
    scheduledDate: "2026-09-15",
    scheduledTime: null,
    scheduledEndDate: "2026-09-30",
    scheduledEndTime: null,
  });
});
