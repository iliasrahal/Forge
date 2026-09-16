-- Évolution additive du suivi opérationnel des chantiers.
ALTER TABLE "Intervention" ADD COLUMN "progressBp" INTEGER;
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_progressBp_check" CHECK ("progressBp" IS NULL OR ("progressBp" >= 0 AND "progressBp" <= 10000));

ALTER TABLE "InterventionDayTask"
  ALTER COLUMN "date" DROP NOT NULL,
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'TODO',
  ADD COLUMN "assignedToId" TEXT;

UPDATE "InterventionDayTask"
SET "status" = CASE WHEN "completedAt" IS NULL THEN 'TODO' ELSE 'DONE' END;

ALTER TABLE "InterventionWorkTime"
  ADD COLUMN "note" TEXT,
  ADD COLUMN "creationKey" TEXT;

ALTER TABLE "InterventionExpense"
  ADD COLUMN "note" TEXT,
  ADD COLUMN "creationKey" TEXT;

CREATE TABLE "InterventionMaterialUsage" (
  "id" TEXT NOT NULL,
  "interventionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "dayDate" TIMESTAMP(3),
  "materialCatalogItemId" TEXT,
  "workspaceMaterialId" TEXT,
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "reference" TEXT,
  "specifications" JSONB,
  "quantityMilli" INTEGER NOT NULL DEFAULT 1000,
  "unit" TEXT NOT NULL DEFAULT 'u',
  "actualUnitCostCents" INTEGER,
  "note" TEXT,
  "creationKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterventionMaterialUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InterventionWorkTime_creationKey_key" ON "InterventionWorkTime"("creationKey");
CREATE UNIQUE INDEX "InterventionExpense_creationKey_key" ON "InterventionExpense"("creationKey");
CREATE UNIQUE INDEX "InterventionMaterialUsage_creationKey_key" ON "InterventionMaterialUsage"("creationKey");
CREATE INDEX "InterventionDayTask_assignedToId_idx" ON "InterventionDayTask"("assignedToId");
CREATE INDEX "InterventionMaterialUsage_interventionId_dayDate_idx" ON "InterventionMaterialUsage"("interventionId", "dayDate");
CREATE INDEX "InterventionMaterialUsage_organizationId_idx" ON "InterventionMaterialUsage"("organizationId");
CREATE INDEX "InterventionMaterialUsage_materialCatalogItemId_idx" ON "InterventionMaterialUsage"("materialCatalogItemId");
CREATE INDEX "InterventionMaterialUsage_workspaceMaterialId_idx" ON "InterventionMaterialUsage"("workspaceMaterialId");

ALTER TABLE "InterventionDayTask" ADD CONSTRAINT "InterventionDayTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InterventionMaterialUsage" ADD CONSTRAINT "InterventionMaterialUsage_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterventionMaterialUsage" ADD CONSTRAINT "InterventionMaterialUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterventionMaterialUsage" ADD CONSTRAINT "InterventionMaterialUsage_materialCatalogItemId_fkey" FOREIGN KEY ("materialCatalogItemId") REFERENCES "MaterialCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InterventionMaterialUsage" ADD CONSTRAINT "InterventionMaterialUsage_workspaceMaterialId_fkey" FOREIGN KEY ("workspaceMaterialId") REFERENCES "WorkspaceMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
