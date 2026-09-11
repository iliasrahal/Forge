-- Bascule d'envoi automatique (sans validation) des relances, par organisation
-- et par type de document. Migration additive.

ALTER TABLE "Organization"
    ADD COLUMN IF NOT EXISTS "quoteReminderAutoSend" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "invoiceReminderAutoSend" BOOLEAN NOT NULL DEFAULT false;
