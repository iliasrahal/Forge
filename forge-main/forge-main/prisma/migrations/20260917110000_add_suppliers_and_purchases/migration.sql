CREATE TYPE "PurchaseStatus" AS ENUM ('ACTIVE', 'VOIDED');

CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "companyName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "website" TEXT,
  "accountReference" TEXT,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Purchase" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "supplierId" TEXT,
  "interventionId" TEXT,
  "purchasedAt" TIMESTAMP(3) NOT NULL,
  "reference" TEXT,
  "supplierName" TEXT,
  "note" TEXT,
  "netAmountCents" INTEGER NOT NULL,
  "vatAmountCents" INTEGER NOT NULL,
  "totalAmountCents" INTEGER NOT NULL,
  "status" "PurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseLine" (
  "id" TEXT NOT NULL,
  "purchaseId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "materialCatalogItemId" TEXT,
  "workspaceMaterialId" TEXT,
  "lineType" TEXT NOT NULL DEFAULT 'MATERIAL',
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "reference" TEXT,
  "quantityMilli" INTEGER NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'u',
  "unitPriceCents" INTEGER NOT NULL,
  "vatRateBp" INTEGER NOT NULL DEFAULT 0,
  "netAmountCents" INTEGER NOT NULL,
  "vatAmountCents" INTEGER NOT NULL,
  "totalAmountCents" INTEGER NOT NULL,
  "supplierName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseAllocation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "purchaseId" TEXT NOT NULL,
  "purchaseLineId" TEXT NOT NULL,
  "interventionId" TEXT NOT NULL,
  "materialUsageId" TEXT,
  "quantityMilli" INTEGER NOT NULL,
  "unitCostCents" INTEGER NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "lineType" TEXT NOT NULL DEFAULT 'MATERIAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseAllocation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkspaceMaterial" ADD COLUMN "preferredSupplierId" TEXT;
ALTER TABLE "InterventionExpense" ADD COLUMN "purchaseId" TEXT;
ALTER TABLE "InterventionMaterialUsage" ADD COLUMN "purchaseLineId" TEXT;

CREATE INDEX "Supplier_organizationId_active_idx" ON "Supplier"("organizationId", "active");
CREATE INDEX "Supplier_organizationId_name_idx" ON "Supplier"("organizationId", "name");
CREATE INDEX "Purchase_organizationId_purchasedAt_idx" ON "Purchase"("organizationId", "purchasedAt");
CREATE INDEX "Purchase_organizationId_supplierId_idx" ON "Purchase"("organizationId", "supplierId");
CREATE INDEX "Purchase_organizationId_interventionId_idx" ON "Purchase"("organizationId", "interventionId");
CREATE INDEX "PurchaseLine_organizationId_materialCatalogItemId_idx" ON "PurchaseLine"("organizationId", "materialCatalogItemId");
CREATE INDEX "PurchaseLine_organizationId_workspaceMaterialId_idx" ON "PurchaseLine"("organizationId", "workspaceMaterialId");
CREATE INDEX "PurchaseLine_purchaseId_idx" ON "PurchaseLine"("purchaseId");
CREATE UNIQUE INDEX "PurchaseAllocation_materialUsageId_key" ON "PurchaseAllocation"("materialUsageId");
CREATE INDEX "PurchaseAllocation_organizationId_interventionId_idx" ON "PurchaseAllocation"("organizationId", "interventionId");
CREATE INDEX "PurchaseAllocation_purchaseLineId_idx" ON "PurchaseAllocation"("purchaseLineId");
CREATE INDEX "PurchaseAllocation_purchaseId_idx" ON "PurchaseAllocation"("purchaseId");
CREATE INDEX "WorkspaceMaterial_preferredSupplierId_idx" ON "WorkspaceMaterial"("preferredSupplierId");
CREATE INDEX "InterventionExpense_purchaseId_idx" ON "InterventionExpense"("purchaseId");
CREATE INDEX "InterventionMaterialUsage_purchaseLineId_idx" ON "InterventionMaterialUsage"("purchaseLineId");

ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseLine" ADD CONSTRAINT "PurchaseLine_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseLine" ADD CONSTRAINT "PurchaseLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseLine" ADD CONSTRAINT "PurchaseLine_materialCatalogItemId_fkey" FOREIGN KEY ("materialCatalogItemId") REFERENCES "MaterialCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseLine" ADD CONSTRAINT "PurchaseLine_workspaceMaterialId_fkey" FOREIGN KEY ("workspaceMaterialId") REFERENCES "WorkspaceMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseAllocation" ADD CONSTRAINT "PurchaseAllocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseAllocation" ADD CONSTRAINT "PurchaseAllocation_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseAllocation" ADD CONSTRAINT "PurchaseAllocation_purchaseLineId_fkey" FOREIGN KEY ("purchaseLineId") REFERENCES "PurchaseLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseAllocation" ADD CONSTRAINT "PurchaseAllocation_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseAllocation" ADD CONSTRAINT "PurchaseAllocation_materialUsageId_fkey" FOREIGN KEY ("materialUsageId") REFERENCES "InterventionMaterialUsage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMaterial" ADD CONSTRAINT "WorkspaceMaterial_preferredSupplierId_fkey" FOREIGN KEY ("preferredSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InterventionExpense" ADD CONSTRAINT "InterventionExpense_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InterventionMaterialUsage" ADD CONSTRAINT "InterventionMaterialUsage_purchaseLineId_fkey" FOREIGN KEY ("purchaseLineId") REFERENCES "PurchaseLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
