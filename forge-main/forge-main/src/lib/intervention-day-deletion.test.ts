import assert from "node:assert/strict";
import test from "node:test";

import { getInterventionDayDeletionProtection } from "./intervention-day-deletion";

const plannedDay = {
  startedAt: null,
  completedAt: null,
  report: null,
  hasWorkTimes: false,
  hasExpenses: false,
};

test("autorise une journée vide ou avec de simples tâches planifiées", () => {
  assert.equal(getInterventionDayDeletionProtection({ ...plannedDay, tasks: [] }), null);
  assert.equal(getInterventionDayDeletionProtection({ ...plannedDay, tasks: [{ completedAt: null, report: null }] }), null);
});

test("protège une journée en cours", () => {
  assert.equal(getInterventionDayDeletionProtection({ ...plannedDay, startedAt: new Date(), tasks: [] }), "IN_PROGRESS");
});

test("protège chaque forme d’historique réalisé", () => {
  assert.equal(getInterventionDayDeletionProtection({ ...plannedDay, hasWorkTimes: true, tasks: [] }), "HISTORY");
  assert.equal(getInterventionDayDeletionProtection({ ...plannedDay, hasExpenses: true, tasks: [] }), "HISTORY");
  assert.equal(getInterventionDayDeletionProtection({ ...plannedDay, report: "Réalisé", tasks: [] }), "HISTORY");
  assert.equal(getInterventionDayDeletionProtection({ ...plannedDay, tasks: [{ completedAt: new Date(), report: null }] }), "HISTORY");
});
