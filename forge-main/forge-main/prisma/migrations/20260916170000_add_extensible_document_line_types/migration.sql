ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "lineType" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "sourceWorkTemplateId" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "sourceWorkTemplateName" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "sourceWorkTemplateVersionAt" TIMESTAMP(3);

ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "lineType" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "sourceWorkTemplateId" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "sourceWorkTemplateName" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "sourceWorkTemplateVersionAt" TIMESTAMP(3);

ALTER TABLE "QuoteTemplateLine" ADD COLUMN IF NOT EXISTS "lineType" TEXT;
ALTER TABLE "QuoteTemplateLine" ADD COLUMN IF NOT EXISTS "materialCatalogItemId" TEXT;
ALTER TABLE "QuoteTemplateLine" ADD COLUMN IF NOT EXISTS "workspaceMaterialId" TEXT;
ALTER TABLE "QuoteTemplateLine" ADD COLUMN IF NOT EXISTS "materialName" TEXT;
ALTER TABLE "QuoteTemplateLine" ADD COLUMN IF NOT EXISTS "materialBrand" TEXT;
ALTER TABLE "QuoteTemplateLine" ADD COLUMN IF NOT EXISTS "materialReference" TEXT;
ALTER TABLE "QuoteTemplateLine" ADD COLUMN IF NOT EXISTS "materialSpecifications" JSONB;
ALTER TABLE "QuoteTemplateLine" ADD COLUMN IF NOT EXISTS "materialSupplier" TEXT;

CREATE TABLE IF NOT EXISTS "QuoteTemplateLineDetail" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "quantityMilli" INTEGER NOT NULL DEFAULT 1000,
  "unit" TEXT NOT NULL DEFAULT 'forfait',
  "unitPriceCents" INTEGER,
  "amountCents" INTEGER,
  "position" INTEGER NOT NULL DEFAULT 0,
  "templateLineId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuoteTemplateLineDetail_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuoteTemplateLineDetail_templateLineId_fkey" FOREIGN KEY ("templateLineId") REFERENCES "QuoteTemplateLine"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "QuoteTemplateLineDetail_templateLineId_position_idx" ON "QuoteTemplateLineDetail"("templateLineId", "position");
