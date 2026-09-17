-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "StockMovementOrigin" AS ENUM ('MANUAL', 'PURCHASE', 'MATERIAL_USAGE', 'INVOICE');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "creationKey" TEXT;

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceMaterialId" TEXT NOT NULL,
    "quantityMilli" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantityMilli" INTEGER NOT NULL DEFAULT 0,
    "lowStockThresholdMilli" INTEGER,
    "averageUnitCostCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "origin" "StockMovementOrigin" NOT NULL,
    "quantityDeltaMilli" INTEGER NOT NULL,
    "balanceAfterMilli" INTEGER NOT NULL,
    "unitCostCents" INTEGER,
    "sourceKey" TEXT,
    "sourceId" TEXT,
    "sourceLabel" TEXT,
    "interventionId" TEXT,
    "purchaseId" TEXT,
    "invoiceId" TEXT,
    "materialUsageId" TEXT,
    "actorUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_creationKey_key" ON "Purchase"("creationKey");
CREATE UNIQUE INDEX "StockItem_workspaceMaterialId_key" ON "StockItem"("workspaceMaterialId");
CREATE INDEX "StockItem_organizationId_idx" ON "StockItem"("organizationId");
CREATE INDEX "StockItem_organizationId_quantityMilli_idx" ON "StockItem"("organizationId", "quantityMilli");
CREATE UNIQUE INDEX "StockMovement_sourceKey_key" ON "StockMovement"("sourceKey");
CREATE UNIQUE INDEX "StockMovement_materialUsageId_key" ON "StockMovement"("materialUsageId");
CREATE INDEX "StockMovement_organizationId_createdAt_idx" ON "StockMovement"("organizationId", "createdAt");
CREATE INDEX "StockMovement_stockItemId_createdAt_idx" ON "StockMovement"("stockItemId", "createdAt");
CREATE INDEX "StockMovement_interventionId_idx" ON "StockMovement"("interventionId");
CREATE INDEX "StockMovement_purchaseId_idx" ON "StockMovement"("purchaseId");
CREATE INDEX "StockMovement_invoiceId_idx" ON "StockMovement"("invoiceId");

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_workspaceMaterialId_fkey" FOREIGN KEY ("workspaceMaterialId") REFERENCES "WorkspaceMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_materialUsageId_fkey" FOREIGN KEY ("materialUsageId") REFERENCES "InterventionMaterialUsage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
