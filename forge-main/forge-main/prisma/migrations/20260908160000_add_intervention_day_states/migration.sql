-- Progression d'une journée distincte de celle des tâches et du chantier global.
CREATE TABLE IF NOT EXISTS "InterventionDayState" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "report" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterventionDayState_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InterventionDayState_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "InterventionDayState_interventionId_date_key"
    ON "InterventionDayState"("interventionId", "date");
CREATE INDEX IF NOT EXISTS "InterventionDayState_interventionId_date_idx"
    ON "InterventionDayState"("interventionId", "date");
