import assert from "node:assert/strict";
import test from "node:test";

import {
  listInterventionDateKeys,
  normalizeInterventionDayTasks,
} from "./intervention-day-tasks";

test("conserve plusieurs tâches le même jour dans leur ordre", () => {
  const tasks = normalizeInterventionDayTasks(
    [
      { date: "2027-05-16", title: "Préparer le mur" },
      { date: "2027-05-16", title: "Passer les câbles", time: "09:00" },
    ],
    new Date("2027-05-14T22:00:00Z"),
    new Date("2027-05-30T21:59:59Z"),
  );
  assert.equal(tasks.length, 2);
  assert.equal(tasks[1].startTime, "09:00");
  assert.deepEqual(tasks.map((task) => task.position), [0, 1]);
});

test("énumère chaque journée d'une période traversant deux mois", () => {
  assert.deepEqual(
    listInterventionDateKeys(
      new Date("2027-05-30T22:00:00Z"),
      new Date("2027-06-02T21:59:59Z"),
    ),
    ["2027-05-31", "2027-06-01", "2027-06-02"],
  );
});

test("ignore les tâches hors période ou invalides", () => {
  const tasks = normalizeInterventionDayTasks(
    [
      { date: "2027-05-14", title: "Trop tôt" },
      { date: "2027-05-15", title: "Valide" },
      { date: "2027-06-01", title: "Trop tard" },
      { date: "2027-05-16", title: "" },
    ],
    new Date("2027-05-14T22:00:00Z"),
    new Date("2027-05-30T21:59:59Z"),
  );
  assert.deepEqual(tasks.map((task) => task.title), ["Valide"]);
});
