CREATE TABLE "InterventionAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterventionAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterventionDayAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterventionDayAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InterventionAssignment_interventionId_userId_key" ON "InterventionAssignment"("interventionId", "userId");
CREATE INDEX "InterventionAssignment_organizationId_userId_idx" ON "InterventionAssignment"("organizationId", "userId");
CREATE UNIQUE INDEX "InterventionDayAssignment_interventionId_date_userId_key" ON "InterventionDayAssignment"("interventionId", "date", "userId");
CREATE INDEX "InterventionDayAssignment_organizationId_userId_date_idx" ON "InterventionDayAssignment"("organizationId", "userId", "date");

ALTER TABLE "InterventionAssignment" ADD CONSTRAINT "InterventionAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterventionAssignment" ADD CONSTRAINT "InterventionAssignment_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterventionAssignment" ADD CONSTRAINT "InterventionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterventionDayAssignment" ADD CONSTRAINT "InterventionDayAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterventionDayAssignment" ADD CONSTRAINT "InterventionDayAssignment_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterventionDayAssignment" ADD CONSTRAINT "InterventionDayAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "InterventionAssignment" ("id", "organizationId", "interventionId", "userId", "createdAt")
SELECT 'ia_' || md5(random()::text || clock_timestamp()::text || "id"), "organizationId", "id", "assignedToId", CURRENT_TIMESTAMP
FROM "Intervention"
WHERE "organizationId" IS NOT NULL AND "assignedToId" IS NOT NULL
ON CONFLICT ("interventionId", "userId") DO NOTHING;
