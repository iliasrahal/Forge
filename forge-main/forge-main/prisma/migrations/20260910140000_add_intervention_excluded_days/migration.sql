CREATE TABLE IF NOT EXISTS "InterventionExcludedDay" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterventionExcludedDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InterventionExcludedDay_interventionId_date_key"
ON "InterventionExcludedDay"("interventionId", "date");

CREATE INDEX IF NOT EXISTS "InterventionExcludedDay_interventionId_date_idx"
ON "InterventionExcludedDay"("interventionId", "date");

DO $$ BEGIN
  ALTER TABLE "InterventionExcludedDay"
  ADD CONSTRAINT "InterventionExcludedDay_interventionId_fkey"
  FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
