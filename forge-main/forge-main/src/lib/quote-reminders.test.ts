import assert from "node:assert/strict";
import test from "node:test";

import { buildStandardReminderMessage, getQuoteReminderState, isReminderCoolingDown, validateReminderMessage } from "./quote-reminders";

const now = new Date("2026-09-10T12:00:00.000Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

test("un devis envoyé depuis un jour n'est pas proposé", () => {
  assert.equal(getQuoteReminderState({ status: "ENVOYE", sentAt: daysAgo(1), reminders: [], now }).eligible, false);
});

test("un devis envoyé depuis quatre jours propose la première relance", () => {
  const state = getQuoteReminderState({ status: "ENVOYE", sentAt: daysAgo(4), reminders: [], now });
  assert.equal(state.eligible, true);
  assert.equal(state.level, 1);
});

test("une relance récente suspend la deuxième proposition", () => {
  assert.equal(getQuoteReminderState({ status: "ENVOYE", sentAt: daysAgo(12), reminders: [{ sentAt: daysAgo(1) }], now }).eligible, false);
});

test("une relance vieille de huit jours propose la deuxième", () => {
  const state = getQuoteReminderState({ status: "ENVOYE", sentAt: daysAgo(20), reminders: [{ sentAt: daysAgo(8) }], now });
  assert.equal(state.eligible, true);
  assert.equal(state.level, 2);
});

test("deux relances ou un statut terminal ne proposent rien", () => {
  assert.equal(getQuoteReminderState({ status: "ENVOYE", sentAt: daysAgo(30), reminders: [{ sentAt: daysAgo(20) }, { sentAt: daysAgo(10) }], now }).eligible, false);
  assert.equal(getQuoteReminderState({ status: "ACCEPTE", sentAt: daysAgo(4), reminders: [], now }).eligible, false);
  assert.equal(getQuoteReminderState({ status: "REFUSE", sentAt: daysAgo(4), reminders: [], now }).eligible, false);
  assert.equal(getQuoteReminderState({ status: "BROUILLON", sentAt: daysAgo(4), reminders: [], now }).eligible, false);
});

test("le cooldown empêche deux envois immédiats", () => {
  assert.equal(isReminderCoolingDown(new Date(now.getTime() - 60_000), now), true);
  assert.equal(isReminderCoolingDown(daysAgo(2), now), false);
});

test("le fallback est professionnel et le message reste modifiable", () => {
  const message = buildStandardReminderMessage({ level: 1, clientName: "Monsieur Dupont", reference: "DEV-12", sentAt: daysAgo(4), artisanSignature: "Mohamed" });
  assert.match(message, /DEV-12/);
  assert.equal(validateReminderMessage(`${message}\nMerci.`).error, null);
});
