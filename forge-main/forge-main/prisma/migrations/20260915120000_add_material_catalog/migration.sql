-- Bibliothèque matériel : migration additive, compatible PostgreSQL/Supabase.
DO $$ BEGIN
  CREATE TYPE "MaterialAnalysisStatus" AS ENUM ('PROCESSING', 'NEEDS_INPUT', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MaterialCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaterialCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MaterialCatalogItem" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT,
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "reference" TEXT,
  "description" TEXT,
  "specifications" JSONB,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "unit" TEXT NOT NULL DEFAULT 'u',
  "defaultPurchasePriceCents" INTEGER,
  "defaultSalePriceCents" INTEGER,
  "supplier" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "isFixture" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaterialCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkspaceMaterial" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "catalogItemId" TEXT,
  "name" TEXT,
  "brand" TEXT,
  "reference" TEXT,
  "description" TEXT,
  "specifications" JSONB,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "unit" TEXT,
  "purchasePriceCents" INTEGER,
  "salePriceCents" INTEGER,
  "supplier" TEXT,
  "favorite" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceMaterial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MaterialAnalysis" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "requestedById" TEXT,
  "model" TEXT NOT NULL,
  "status" "MaterialAnalysisStatus" NOT NULL DEFAULT 'PROCESSING',
  "photoCount" INTEGER NOT NULL,
  "inputHash" TEXT,
  "result" JSONB,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaterialAnalysis_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "materialCatalogItemId" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "workspaceMaterialId" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "materialName" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "materialBrand" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "materialReference" TEXT;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "materialSpecifications" JSONB;
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "materialSupplier" TEXT;

ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "materialCatalogItemId" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "workspaceMaterialId" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "materialName" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "materialBrand" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "materialReference" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "materialSpecifications" JSONB;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "materialSupplier" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "MaterialCategory_slug_key" ON "MaterialCategory"("slug");
CREATE INDEX IF NOT EXISTS "MaterialCategory_parentId_position_idx" ON "MaterialCategory"("parentId", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "MaterialCatalogItem_brand_reference_key" ON "MaterialCatalogItem"("brand", "reference");
CREATE INDEX IF NOT EXISTS "MaterialCatalogItem_categoryId_active_idx" ON "MaterialCatalogItem"("categoryId", "active");
CREATE INDEX IF NOT EXISTS "MaterialCatalogItem_name_idx" ON "MaterialCatalogItem"("name");
CREATE INDEX IF NOT EXISTS "MaterialCatalogItem_reference_idx" ON "MaterialCatalogItem"("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMaterial_organizationId_catalogItemId_key" ON "WorkspaceMaterial"("organizationId", "catalogItemId");
CREATE INDEX IF NOT EXISTS "WorkspaceMaterial_organizationId_active_idx" ON "WorkspaceMaterial"("organizationId", "active");
CREATE INDEX IF NOT EXISTS "WorkspaceMaterial_organizationId_name_idx" ON "WorkspaceMaterial"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "WorkspaceMaterial_organizationId_reference_idx" ON "WorkspaceMaterial"("organizationId", "reference");
CREATE INDEX IF NOT EXISTS "MaterialAnalysis_organizationId_createdAt_idx" ON "MaterialAnalysis"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "MaterialAnalysis_requestedById_createdAt_idx" ON "MaterialAnalysis"("requestedById", "createdAt");
CREATE INDEX IF NOT EXISTS "QuoteLine_materialCatalogItemId_idx" ON "QuoteLine"("materialCatalogItemId");
CREATE INDEX IF NOT EXISTS "QuoteLine_workspaceMaterialId_idx" ON "QuoteLine"("workspaceMaterialId");
CREATE INDEX IF NOT EXISTS "InvoiceLine_materialCatalogItemId_idx" ON "InvoiceLine"("materialCatalogItemId");
CREATE INDEX IF NOT EXISTS "InvoiceLine_workspaceMaterialId_idx" ON "InvoiceLine"("workspaceMaterialId");

DO $$ BEGIN
  ALTER TABLE "MaterialCategory" ADD CONSTRAINT "MaterialCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MaterialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "MaterialCatalogItem" ADD CONSTRAINT "MaterialCatalogItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaterialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "WorkspaceMaterial" ADD CONSTRAINT "WorkspaceMaterial_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "WorkspaceMaterial" ADD CONSTRAINT "WorkspaceMaterial_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "MaterialCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "MaterialAnalysis" ADD CONSTRAINT "MaterialAnalysis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "MaterialAnalysis" ADD CONSTRAINT "MaterialAnalysis_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_materialCatalogItemId_fkey" FOREIGN KEY ("materialCatalogItemId") REFERENCES "MaterialCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_workspaceMaterialId_fkey" FOREIGN KEY ("workspaceMaterialId") REFERENCES "WorkspaceMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_materialCatalogItemId_fkey" FOREIGN KEY ("materialCatalogItemId") REFERENCES "MaterialCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_workspaceMaterialId_fkey" FOREIGN KEY ("workspaceMaterialId") REFERENCES "WorkspaceMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Petit jeu technique explicitement marqué fixture. Il sert aux tests du
-- matching et sera remplacé par le catalogue métier validé ultérieurement.
INSERT INTO "MaterialCategory" ("id", "name", "slug", "position", "updatedAt") VALUES
  ('fixture_cat_chauffage', 'Chauffage', 'chauffage', 10, CURRENT_TIMESTAMP),
  ('fixture_cat_plomberie', 'Plomberie', 'plomberie', 20, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "MaterialCatalogItem" (
  "id", "categoryId", "name", "brand", "reference", "description", "specifications", "tags", "unit",
  "defaultPurchasePriceCents", "defaultSalePriceCents", "supplier", "isFixture", "updatedAt"
) VALUES
  ('fixture_mat_pump_25_60', 'fixture_cat_chauffage', 'Circulateur chauffage 25-60', 'Forge Test', 'FT-CIRC-25-60', 'Fixture technique pour valider le matching.', '{"type":"circulateur","diameter":"25","head":"6m"}'::jsonb, ARRAY['circulateur','chauffage','25-60'], 'u', 8900, 13900, 'Fournisseur test', true, CURRENT_TIMESTAMP),
  ('fixture_mat_valve_20_27', 'fixture_cat_plomberie', 'Vanne à boisseau 20/27', 'Forge Test', 'FT-VANNE-20-27', 'Fixture technique pour valider le matching.', '{"type":"vanne","thread":"20/27"}'::jsonb, ARRAY['vanne','plomberie','20/27'], 'u', 850, 1590, 'Fournisseur test', true, CURRENT_TIMESTAMP),
  ('fixture_mat_tank_200l', 'fixture_cat_chauffage', 'Chauffe-eau électrique 200 L', 'Forge Test', 'FT-CE-200-V', 'Fixture technique pour valider le matching.', '{"type":"chauffe-eau","capacity":"200 L","orientation":"vertical"}'::jsonb, ARRAY['chauffe-eau','ballon','200l'], 'u', 31900, 48900, 'Fournisseur test', true, CURRENT_TIMESTAMP)
ON CONFLICT ("brand", "reference") DO NOTHING;
