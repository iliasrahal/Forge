-- Extension additive : toutes les factures existantes restent STANDARD.
CREATE TYPE "InvoiceType" AS ENUM ('STANDARD', 'DEPOSIT');

ALTER TABLE "Invoice"
ADD COLUMN "type" "InvoiceType" NOT NULL DEFAULT 'STANDARD';

CREATE INDEX "Invoice_quoteId_type_idx" ON "Invoice"("quoteId", "type");
