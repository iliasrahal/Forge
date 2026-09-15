-- Additive image metadata for the global Forge material catalog and
-- organization-scoped custom material images. No existing data is changed.
CREATE TYPE "MaterialImageKind" AS ENUM ('PRODUCT', 'DETAIL', 'NAMEPLATE', 'TECHNICAL');
CREATE TYPE "MaterialCatalogImageSourceType" AS ENUM ('MANUFACTURER', 'AUTHORIZED_SUPPLIER', 'AUTHORIZED_IMPORT');
CREATE TYPE "WorkspaceMaterialImageSourceType" AS ENUM ('WORKSPACE_UPLOAD');

CREATE TABLE "MaterialCatalogImage" (
    "id" TEXT NOT NULL,
    "materialCatalogItemId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "kind" "MaterialImageKind" NOT NULL DEFAULT 'PRODUCT',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "sourceType" "MaterialCatalogImageSourceType" NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "license" TEXT,
    "rightsExpiresAt" TIMESTAMP(3),
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaterialCatalogImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMaterialImage" (
    "id" TEXT NOT NULL,
    "workspaceMaterialId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "kind" "MaterialImageKind" NOT NULL DEFAULT 'PRODUCT',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "sourceType" "WorkspaceMaterialImageSourceType" NOT NULL DEFAULT 'WORKSPACE_UPLOAD',
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceMaterialImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaterialCatalogImage_objectKey_key" ON "MaterialCatalogImage"("objectKey");
CREATE UNIQUE INDEX "MaterialCatalogImage_materialCatalogItemId_checksum_key" ON "MaterialCatalogImage"("materialCatalogItemId", "checksum");
CREATE INDEX "MaterialCatalogImage_materialCatalogItemId_isPrimary_position_idx" ON "MaterialCatalogImage"("materialCatalogItemId", "isPrimary", "position");
CREATE UNIQUE INDEX "MaterialCatalogImage_one_primary_per_item_idx" ON "MaterialCatalogImage"("materialCatalogItemId") WHERE "isPrimary" = true;
CREATE UNIQUE INDEX "WorkspaceMaterialImage_objectKey_key" ON "WorkspaceMaterialImage"("objectKey");
CREATE UNIQUE INDEX "WorkspaceMaterialImage_workspaceMaterialId_checksum_key" ON "WorkspaceMaterialImage"("workspaceMaterialId", "checksum");
CREATE INDEX "WorkspaceMaterialImage_organizationId_workspaceMaterialId_idx" ON "WorkspaceMaterialImage"("organizationId", "workspaceMaterialId");
CREATE INDEX "WorkspaceMaterialImage_workspaceMaterialId_isPrimary_position_idx" ON "WorkspaceMaterialImage"("workspaceMaterialId", "isPrimary", "position");
CREATE UNIQUE INDEX "WorkspaceMaterialImage_one_primary_per_item_idx" ON "WorkspaceMaterialImage"("workspaceMaterialId") WHERE "isPrimary" = true;

ALTER TABLE "MaterialCatalogImage" ADD CONSTRAINT "MaterialCatalogImage_materialCatalogItemId_fkey" FOREIGN KEY ("materialCatalogItemId") REFERENCES "MaterialCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMaterialImage" ADD CONSTRAINT "WorkspaceMaterialImage_workspaceMaterialId_fkey" FOREIGN KEY ("workspaceMaterialId") REFERENCES "WorkspaceMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMaterialImage" ADD CONSTRAINT "WorkspaceMaterialImage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
