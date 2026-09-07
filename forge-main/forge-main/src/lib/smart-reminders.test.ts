import assert from "node:assert/strict";
import test from "node:test";

import { buildSmartReminders } from "./smart-reminders";

const now = new Date("2026-09-10T12:00:00.000Z");
const ago = (days: number) => new Date(now.getTime() - days * 86_400_000);
const client = { type: "PARTICULIER", firstName: "Charles", lastName: null, companyName: null };

function reminders(overrides: Partial<Parameters<typeof buildSmartReminders>[0]> = {}) {
  return buildSmartReminders({ quotes: [], invoices: [], interventions: [], now, ...overrides });
}

test("un devis brouillon ancien est rappelé une seule fois, avec ou sans client", () => {
  const result = reminders({
    quotes: [
      { id: "q1", clientId: "c1", client, status: "BROUILLON", createdAt: ago(2), sentAt: null, reminders: [] },
      { id: "q2", clientId: null, client: null, status: "BROUILLON", createdAt: ago(2), sentAt: null, reminders: [] },
    ],
  });
  assert.equal(result.length, 2);
  assert.equal(result[0].kind, "QUOTE_DRAFT");
  assert.match(result[1].detail, /aucun client/i);
});

test("un devis envoyé n’a plus le rappel brouillon mais obtient la relance à J+3", () => {
  const result = reminders({
    quotes: [{ id: "q", clientId: "c", client, status: "ENVOYE", createdAt: ago(10), sentAt: ago(4), reminders: [] }],
  });
  assert.deepEqual(result.map(({ kind }) => kind), ["QUOTE_WAITING"]);
});

test("un devis accepté ou refusé ne produit aucun rappel", () => {
  const quotes = (["ACCEPTE", "REFUSE"] as const).map((status) => ({
    id: status,
    clientId: "c",
    client,
    status,
    createdAt: ago(10),
    sentAt: ago(8),
    reminders: [],
  }));
  assert.equal(reminders({ quotes }).length, 0);
});

test("une facture brouillon ancienne est à envoyer puis disparaît une fois envoyée", () => {
  const base = { id: "i", reference: "FAC-1", amountCents: 10000, createdAt: ago(2), updatedAt: ago(2), dueDate: null, client, payments: [] };
  assert.equal(reminders({ invoices: [{ ...base, status: "BROUILLON" }] })[0]?.kind, "INVOICE_DRAFT");
  assert.equal(reminders({ invoices: [{ ...base, status: "ENVOYEE", updatedAt: ago(1) }] }).length, 0);
});

test("une facture échue et non soldée est rappelée, une facture payée ne l’est pas", () => {
  const base = { id: "i", reference: "FAC-1", amountCents: 10000, createdAt: ago(20), updatedAt: ago(10), dueDate: ago(1), client, payments: [] };
  assert.equal(reminders({ invoices: [{ ...base, status: "ENVOYEE" }] })[0]?.kind, "INVOICE_UNPAID");
  assert.equal(reminders({ invoices: [{ ...base, status: "PAYEE" }] }).length, 0);
  assert.equal(reminders({ invoices: [{ ...base, status: "ANNULEE" }] }).length, 0);
});

test("un paiement réconcilié intégralement supprime le rappel d’impayé", () => {
  const result = reminders({ invoices: [{
    id: "i", reference: "FAC-1", amountCents: 10000, status: "ENVOYEE", createdAt: ago(20), updatedAt: ago(10), dueDate: ago(1), client,
    payments: [{ status: "SUCCEEDED", amountCents: 10000, feeCents: 0, refundedCents: 0, paidAt: ago(1) }],
  }] });
  assert.equal(result.length, 0);
});

test("une intervention terminée sans facture est rappelée puis disparaît avec une facture", () => {
  const base = { id: "x", title: "Chaudière", status: "TERMINEE", finishedAt: ago(2), updatedAt: ago(2), client };
  assert.equal(reminders({ interventions: [{ ...base, invoiceCount: 0 }] })[0]?.kind, "INTERVENTION_UNBILLED");
  assert.equal(reminders({ interventions: [{ ...base, invoiceCount: 1 }] }).length, 0);
});
