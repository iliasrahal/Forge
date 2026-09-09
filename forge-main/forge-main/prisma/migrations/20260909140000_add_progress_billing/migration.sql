-- Facturation à l'avancement : situations de travaux, facture de solde,
-- retenue de garantie. Migration additive.

ALTER TYPE "InvoiceType" ADD VALUE IF NOT EXISTS 'SITUATION';
ALTER TYPE "InvoiceType" ADD VALUE IF NOT EXISTS 'BALANCE';

ALTER TABLE "Quote"
    ADD COLUMN IF NOT EXISTS "retentionBp" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Invoice"
    ADD COLUMN IF NOT EXISTS "situationProgressBp" INTEGER,
    ADD COLUMN IF NOT EXISTS "retentionCents" INTEGER NOT NULL DEFAULT 0;
