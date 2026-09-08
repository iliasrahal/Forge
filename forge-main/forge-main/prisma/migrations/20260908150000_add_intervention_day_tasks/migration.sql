-- Planning journalier facultatif des interventions multi-jours.
-- Migration additive : les interventions existantes restent inchangées.
CREATE TABLE IF NOT EXISTS "InterventionDayTask" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "completedAt" TIMESTAMP(3),
    "report" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterventionDayTask_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InterventionDayTask_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InterventionDayTask_interventionId_date_position_idx"
    ON "InterventionDayTask"("interventionId", "date", "position");
