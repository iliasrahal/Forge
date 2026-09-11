-- Cadence de relance configurable (devis 2 niveaux, factures 3 niveaux) +
-- date de dernier envoi de facture + historique des relances facture.
-- Migration additive.

ALTER TABLE "Organization"
    ADD COLUMN IF NOT EXISTS "quoteReminderDelay1Days" INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS "quoteReminderDelay2Days" INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN IF NOT EXISTS "invoiceReminderDelay1Days" INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN IF NOT EXISTS "invoiceReminderDelay2Days" INTEGER NOT NULL DEFAULT 15,
    ADD COLUMN IF NOT EXISTS "invoiceReminderDelay3Days" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "Invoice"
    ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);

DO $$ BEGIN
    CREATE TYPE "InvoiceReminderChannel" AS ENUM ('EMAIL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "InvoiceReminder" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "channel" "InvoiceReminderChannel" NOT NULL DEFAULT 'EMAIL',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceReminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InvoiceReminder_invoiceId_sentAt_idx" ON "InvoiceReminder"("invoiceId", "sentAt");
CREATE INDEX IF NOT EXISTS "InvoiceReminder_createdByUserId_idx" ON "InvoiceReminder"("createdByUserId");

DO $$ BEGIN
    ALTER TABLE "InvoiceReminder"
        ADD CONSTRAINT "InvoiceReminder_invoiceId_fkey"
        FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "InvoiceReminder"
        ADD CONSTRAINT "InvoiceReminder_createdByUserId_fkey"
        FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
