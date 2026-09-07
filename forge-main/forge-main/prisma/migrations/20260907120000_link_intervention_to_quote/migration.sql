ALTER TABLE "Intervention" ADD COLUMN "quoteId" TEXT;

CREATE INDEX "Intervention_quoteId_idx" ON "Intervention"("quoteId");

ALTER TABLE "Intervention"
ADD CONSTRAINT "Intervention_quoteId_fkey"
FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
