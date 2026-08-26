ALTER TABLE "Invoice" ADD COLUMN "interventionId" TEXT;

CREATE UNIQUE INDEX "Invoice_interventionId_key" ON "Invoice"("interventionId");

CREATE INDEX "Invoice_interventionId_idx" ON "Invoice"("interventionId");

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE SET NULL ON UPDATE CASCADE;
