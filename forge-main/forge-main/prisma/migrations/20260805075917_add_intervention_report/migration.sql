-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN "reportDiagnostic" TEXT;
ALTER TABLE "Intervention" ADD COLUMN "reportIntervention" TEXT;
ALTER TABLE "Intervention" ADD COLUMN "reportRecommendation" TEXT;
ALTER TABLE "Intervention" ADD COLUMN "reportTravaux" TEXT;

-- CreateIndex
CREATE INDEX "Intervention_scheduledAt_idx" ON "Intervention"("scheduledAt");
