import assert from "node:assert/strict";
import test from "node:test";

import { getInterventionDayHistoryKind } from "./intervention-day-deletion";

const plannedDay = {
  startedAt: null,
  completedAt: null,
  report: null,
  hasWorkTimes: false,
  hasExpenses: false,
};

test("autorise une journée vide ou avec de simples tâches planifiées", () => {
  assert.equal(getInterventionDayHistoryKind({ ...plannedDay, tasks: [] }), null);
  assert.equal(getInterventionDayHistoryKind({ ...plannedDay, tasks: [{ completedAt: null, report: null }] }), null);
});

test("détecte une journée en cours pour renforcer sa confirmation", () => {
  assert.equal(getInterventionDayHistoryKind({ ...plannedDay, startedAt: new Date(), tasks: [] }), "IN_PROGRESS");
});

test("détecte chaque forme d’historique réalisé", () => {
  assert.equal(getInterventionDayHistoryKind({ ...plannedDay, hasWorkTimes: true, tasks: [] }), "HISTORY");
  assert.equal(getInterventionDayHistoryKind({ ...plannedDay, hasExpenses: true, tasks: [] }), "HISTORY");
  assert.equal(getInterventionDayHistoryKind({ ...plannedDay, report: "Réalisé", tasks: [] }), "HISTORY");
  assert.equal(getInterventionDayHistoryKind({ ...plannedDay, tasks: [{ completedAt: new Date(), report: null }] }), "HISTORY");
});
