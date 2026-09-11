import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStandardInvoiceReminderMessage,
  getInvoiceReminderState,
  isInvoiceReminderCoolingDown,
  validateInvoiceReminderMessage,
} from "./invoice-reminders";

const now = new Date("2026-09-10T12:00:00.000Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

test("une facture échue depuis deux jours n'est pas encore proposée", () => {
  const state = getInvoiceReminderState({
    status: "ENVOYEE",
    dueDate: daysAgo(2),
    sentAt: daysAgo(10),
    createdAt: daysAgo(10),
    reminders: [],
    now,
  });
  assert.equal(state.eligible, false);
});

test("une facture échue depuis huit jours propose la première relance", () => {
  const state = getInvoiceReminderState({
    status: "ENVOYEE",
    dueDate: daysAgo(8),
    sentAt: daysAgo(20),
    createdAt: daysAgo(20),
    reminders: [],
    now,
  });
  assert.equal(state.eligible, true);
  assert.equal(state.level, 1);
});

test("une relance récente suspend la deuxième proposition", () => {
  const state = getInvoiceReminderState({
    status: "ENVOYEE",
    dueDate: daysAgo(20),
    sentAt: daysAgo(30),
    createdAt: daysAgo(30),
    reminders: [{ sentAt: daysAgo(1) }],
    now,
  });
  assert.equal(state.eligible, false);
});

test("une relance vieille de seize jours propose la deuxième", () => {
  const state = getInvoiceReminderState({
    status: "EN_RETARD",
    dueDate: daysAgo(40),
    sentAt: daysAgo(45),
    createdAt: daysAgo(45),
    reminders: [{ sentAt: daysAgo(16) }],
    now,
  });
  assert.equal(state.eligible, true);
  assert.equal(state.level, 2);
});

test("une relance vieille de trente et un jours propose la troisième", () => {
  const state = getInvoiceReminderState({
    status: "EN_RETARD",
    dueDate: daysAgo(60),
    sentAt: daysAgo(65),
    createdAt: daysAgo(65),
    reminders: [{ sentAt: daysAgo(40) }, { sentAt: daysAgo(31) }],
    now,
  });
  assert.equal(state.eligible, true);
  assert.equal(state.level, 3);
});

test("trois relances ou un statut non pertinent ne proposent rien", () => {
  assert.equal(
    getInvoiceReminderState({
      status: "EN_RETARD",
      dueDate: daysAgo(90),
      sentAt: daysAgo(95),
      createdAt: daysAgo(95),
      reminders: [{ sentAt: daysAgo(60) }, { sentAt: daysAgo(40) }, { sentAt: daysAgo(31) }],
      now,
    }).eligible,
    false,
  );
  assert.equal(
    getInvoiceReminderState({ status: "PAYEE", dueDate: daysAgo(20), sentAt: daysAgo(25), createdAt: daysAgo(25), reminders: [], now }).eligible,
    false,
  );
  assert.equal(
    getInvoiceReminderState({ status: "BROUILLON", dueDate: daysAgo(20), sentAt: null, createdAt: daysAgo(25), reminders: [], now }).eligible,
    false,
  );
  assert.equal(
    getInvoiceReminderState({ status: "ANNULEE", dueDate: daysAgo(20), sentAt: daysAgo(25), createdAt: daysAgo(25), reminders: [], now }).eligible,
    false,
  );
});

test("les délais de relance sont configurables", () => {
  const state = getInvoiceReminderState({
    status: "ENVOYEE",
    dueDate: daysAgo(4),
    sentAt: daysAgo(20),
    createdAt: daysAgo(20),
    reminders: [],
    now,
    delay1Days: 3,
  });
  assert.equal(state.eligible, true);
  assert.equal(state.level, 1);
});

test("le cooldown empêche deux envois immédiats", () => {
  assert.equal(isInvoiceReminderCoolingDown(new Date(now.getTime() - 60_000), now), true);
  assert.equal(isInvoiceReminderCoolingDown(daysAgo(2), now), false);
});

test("le fallback rappelle le montant restant dû et reste modifiable", () => {
  const message = buildStandardInvoiceReminderMessage({
    level: 1,
    clientName: "Monsieur Dupont",
    reference: "FAC-12",
    dueDate: daysAgo(8),
    remainingCents: 15_000,
    artisanSignature: "Mohamed",
  });
  assert.match(message, /FAC-12/);
  assert.match(message, /150,00/);
  assert.equal(validateInvoiceReminderMessage(`${message}\nMerci.`).error, null);
});
