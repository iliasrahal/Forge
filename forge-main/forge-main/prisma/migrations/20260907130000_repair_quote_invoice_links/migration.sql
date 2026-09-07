-- Réparation additive des liens Devis -> Intervention -> Facture.
-- IF NOT EXISTS rend cette migration sûre pour les bases déjà synchronisées
-- et pour les bases historiques initialement créées avec `db push`.
ALTER TABLE "Intervention" ADD COLUMN IF NOT EXISTS "quoteId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "quoteId" TEXT;

CREATE INDEX IF NOT EXISTS "Intervention_quoteId_idx"
ON "Intervention"("quoteId");

CREATE INDEX IF NOT EXISTS "Invoice_quoteId_idx"
ON "Invoice"("quoteId");

CREATE INDEX IF NOT EXISTS "Invoice_quoteId_type_idx"
ON "Invoice"("quoteId", "type");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Intervention_quoteId_fkey'
  ) THEN
    ALTER TABLE "Intervention"
      ADD CONSTRAINT "Intervention_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Invoice_quoteId_fkey'
  ) THEN
    ALTER TABLE "Invoice"
      ADD CONSTRAINT "Invoice_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
      ON DELETE NO ACTION ON UPDATE CASCADE;
  END IF;
END $$;
