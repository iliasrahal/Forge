ALTER TABLE "Invoice" ADD COLUMN "interventionId" TEXT;

CREATE INDEX "Invoice_interventionId_idx" ON "Invoice"("interventionId");

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE SET NULL ON UPDATE CASCADE;
