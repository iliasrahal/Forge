import assert from "node:assert/strict";
import test from "node:test";

import { computeInterventionProgress } from "./intervention-progress";

test("uses explicit progress first and clamps it", () => {
  assert.deepEqual(computeInterventionProgress({ explicitProgressBp: 7_300, tasks: [{ status: "TODO" }] }), { percent: 73, source: "explicit" });
  assert.deepEqual(computeInterventionProgress({ explicitProgressBp: 20_000 }), { percent: 100, source: "explicit" });
});

test("derives progress from tasks, then days", () => {
  assert.deepEqual(computeInterventionProgress({ tasks: [{ status: "DONE" }, { status: "TODO" }] }), { percent: 50, source: "tasks" });
  assert.deepEqual(computeInterventionProgress({ days: [{ completedAt: new Date() }, { completedAt: null }] }), { percent: 50, source: "days" });
});

test("does not invent a percentage without reliable data", () => {
  assert.equal(computeInterventionProgress({}), null);
});
