-- Bibliothèque métier unifiée : métadonnées additives et futures définitions Forge.
ALTER TABLE "Organization" ADD COLUMN "tradeSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "ServiceCatalogDefinition" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "lineType" TEXT NOT NULL DEFAULT 'SERVICE',
  "unit" TEXT NOT NULL DEFAULT 'forfait',
  "suggestedVatRateBp" INTEGER,
  "tradeSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sourceType" TEXT NOT NULL DEFAULT 'FORGE',
  "sourceName" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceCatalogDefinition_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServiceCatalogItem"
  ADD COLUMN "catalogServiceId" TEXT,
  ADD COLUMN "lineType" TEXT NOT NULL DEFAULT 'SERVICE',
  ADD COLUMN "category" TEXT,
  ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'forfait',
  ADD COLUMN "vatRateBp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "internalCostCents" INTEGER,
  ADD COLUMN "tradeSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "MaterialCatalogItem"
  ADD COLUMN "tradeSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "suggestedVatRateBp" INTEGER,
  ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'FORGE',
  ADD COLUMN "sourceName" TEXT,
  ADD COLUMN "discontinuedAt" TIMESTAMP(3);

ALTER TABLE "QuoteTemplate"
  ADD COLUMN "category" TEXT,
  ADD COLUMN "tradeSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "sourceTemplateId" TEXT;
ALTER TABLE "QuoteTemplate" ALTER COLUMN "organizationId" DROP NOT NULL;

CREATE INDEX "ServiceCatalogDefinition_lineType_active_idx" ON "ServiceCatalogDefinition"("lineType", "active");
CREATE INDEX "ServiceCatalogDefinition_name_idx" ON "ServiceCatalogDefinition"("name");
CREATE UNIQUE INDEX "ServiceCatalogItem_organizationId_catalogServiceId_key" ON "ServiceCatalogItem"("organizationId", "catalogServiceId");
CREATE INDEX "ServiceCatalogItem_organizationId_lineType_active_idx" ON "ServiceCatalogItem"("organizationId", "lineType", "active");
CREATE INDEX "QuoteTemplate_organizationId_active_idx" ON "QuoteTemplate"("organizationId", "active");
CREATE INDEX "QuoteTemplate_sourceTemplateId_idx" ON "QuoteTemplate"("sourceTemplateId");

ALTER TABLE "ServiceCatalogItem" ADD CONSTRAINT "ServiceCatalogItem_catalogServiceId_fkey" FOREIGN KEY ("catalogServiceId") REFERENCES "ServiceCatalogDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteTemplate" ADD CONSTRAINT "QuoteTemplate_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "QuoteTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
