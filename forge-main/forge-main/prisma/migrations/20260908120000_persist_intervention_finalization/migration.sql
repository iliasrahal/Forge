ALTER TABLE "Intervention"
  ADD COLUMN IF NOT EXISTS "finalizationStep" TEXT,
  ADD COLUMN IF NOT EXISTS "reportDraft" TEXT,
  ADD COLUMN IF NOT EXISTS "reportSkippedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "finalizedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Intervention_organizationId_finalizedAt_idx"
  ON "Intervention"("organizationId", "finalizedAt");
