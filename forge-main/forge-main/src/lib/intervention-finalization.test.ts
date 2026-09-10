import assert from "node:assert/strict";
import test from "node:test";

import {
  keepMostAdvancedFinalizationStep,
  resolveFinalizationResumeTarget,
} from "./intervention-finalization";

test("une autosauvegarde tardive ne fait pas régresser la finalisation", () => {
  assert.equal(
    keepMostAdvancedFinalizationStep("INVOICE_CHOICE", "REPORT_INPUT"),
    "INVOICE_CHOICE",
  );
  assert.equal(
    keepMostAdvancedFinalizationStep("INVOICE_CREATED", "REPORT_REVIEW"),
    "INVOICE_CREATED",
  );
});

test("un compte rendu passé reprend au choix de facture", () => {
  assert.deepEqual(
    resolveFinalizationResumeTarget({
      finalizationStep: "REPORT_INPUT",
      reportWasSkipped: true,
    }),
    { kind: "invoiceChoice" },
  );
});

test("une facture ou un devis existant est repris sans doublon", () => {
  assert.deepEqual(
    resolveFinalizationResumeTarget({
      finalizationStep: "REPORT_INPUT",
      invoiceId: "invoice-1",
    }),
    { kind: "invoice", href: "/invoices/invoice-1" },
  );
  assert.deepEqual(
    resolveFinalizationResumeTarget({
      finalizationStep: "QUOTE_CREATED",
      quoteId: "quote-1",
      clientId: "client-1",
    }),
    { kind: "quote", href: "/clients/client-1/quotes/quote-1" },
  );
});

test("une finalisation terminée ne peut pas être reprise", () => {
  assert.deepEqual(
    resolveFinalizationResumeTarget({ finalizationStep: "FINALIZED" }),
    { kind: "finalized" },
  );
});
