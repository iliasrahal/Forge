ALTER TABLE "InterventionDayState"
  ADD COLUMN IF NOT EXISTS "finalizationStep" TEXT,
  ADD COLUMN IF NOT EXISTS "reportDraft" TEXT,
  ADD COLUMN IF NOT EXISTS "reportSkippedAt" TIMESTAMP(3);
