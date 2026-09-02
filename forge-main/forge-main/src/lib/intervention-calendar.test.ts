import assert from "node:assert/strict";
import test from "node:test";
import { groupAppointmentsByDate, splitAppointmentsByDate } from "./intervention-calendar";

test("une intervention multi-jours apparaît sur chaque journée couverte", () => {
  const appointment = { id: "multi", date: "2026-09-10", time: "09:00", endDate: "2026-09-12", status: "scheduled" };
  const grouped = groupAppointmentsByDate([appointment]);
  assert.equal(grouped.get("2026-09-10")?.[0]?.id, "multi");
  assert.equal(grouped.get("2026-09-11")?.[0]?.id, "multi");
  assert.equal(grouped.get("2026-09-12")?.[0]?.id, "multi");
  assert.equal(grouped.has("2026-09-13"), false);
});

test("une intervention en cours sur une plage est visible dans l'accueil du jour", () => {
  const appointment = { id: "multi", date: "2026-09-10", time: "09:00", endDate: "2026-09-15", status: "scheduled" };
  assert.equal(splitAppointmentsByDate([appointment], "2026-09-12").today[0]?.id, "multi");
});

