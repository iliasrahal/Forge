import assert from "node:assert/strict";
import test from "node:test";
import { createParisInterventionPeriod, formatParisDateKey, formatParisTime, getParisDayBounds, parseParisDateTime } from "./paris-datetime";

test("10 h à Paris reste 10 h en hiver", () => {
  const date = parseParisDateTime("2026-01-15", "10:00");
  assert.equal(date?.toISOString(), "2026-01-15T09:00:00.000Z");
  assert.equal(date && formatParisTime(date), "10:00");
});

test("10 h à Paris reste 10 h en été", () => {
  const date = parseParisDateTime("2026-07-15", "10:00");
  assert.equal(date?.toISOString(), "2026-07-15T08:00:00.000Z");
  assert.equal(date && formatParisTime(date), "10:00");
  assert.equal(date && formatParisDateKey(date), "2026-07-15");
});

test("les heures artisan courantes sont conservées", () => {
  for (const time of ["09:00", "10:00", "14:30", "09:15"]) {
    const stored = parseParisDateTime("2026-07-15", time);
    assert.equal(stored && formatParisTime(stored), time);
  }
});

test("les bornes de journée suivent l'heure d'été", () => {
  const bounds = getParisDayBounds("2026-03-29");
  assert.ok(bounds);
  assert.equal(bounds.nextStart.getTime() - bounds.start.getTime(), 23 * 60 * 60 * 1000);
});

test("une plage sans heure couvre toute la dernière journée", () => {
  const period = createParisInterventionPeriod({ scheduledDate: "2026-09-10", scheduledTime: "09:00", scheduledEndDate: "2026-09-15" });
  assert.ok(!("error" in period));
  if (!("error" in period)) {
    assert.equal(period.start.toISOString(), "2026-09-10T07:00:00.000Z");
    assert.equal(period.end?.toISOString(), "2026-09-15T21:59:59.999Z");
  }
});

test("une fin antérieure au début est refusée", () => {
  assert.ok("error" in createParisInterventionPeriod({ scheduledDate: "2026-09-15", scheduledTime: "17:00", scheduledEndDate: "2026-09-10", scheduledEndTime: "09:00" }));
});

test("une période sur la même journée respecte l’ordre des heures", () => {
  const valid = createParisInterventionPeriod({ scheduledDate: "2026-09-15", scheduledTime: "09:00", scheduledEndDate: "2026-09-15", scheduledEndTime: "17:00" });
  assert.ok(!("error" in valid));
  const invalid = createParisInterventionPeriod({ scheduledDate: "2026-09-15", scheduledTime: "17:00", scheduledEndDate: "2026-09-15", scheduledEndTime: "09:00" });
  assert.ok("error" in invalid);
});
