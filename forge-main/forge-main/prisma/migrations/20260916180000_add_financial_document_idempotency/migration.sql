ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "creationKey" TEXT;
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "creationKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_creationKey_key" ON "Invoice"("creationKey");
CREATE UNIQUE INDEX IF NOT EXISTS "CreditNote_creationKey_key" ON "CreditNote"("creationKey");
ALTER TABLE "CreditNoteLine" ADD COLUMN IF NOT EXISTS "lineType" TEXT;
ALTER TABLE "CreditNoteLine" ADD COLUMN IF NOT EXISTS "sourceInvoiceLineId" TEXT;
