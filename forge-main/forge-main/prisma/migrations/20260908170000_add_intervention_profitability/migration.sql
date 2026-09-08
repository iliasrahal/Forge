ALTER TABLE "OrganizationMember"
  ADD COLUMN IF NOT EXISTS "hourlyCostCents" INTEGER;

DO $$ BEGIN
  CREATE TYPE "InterventionExpenseCategory" AS ENUM (
    'MATERIALS', 'SUPPLIES', 'TRAVEL', 'RENTAL', 'SUBCONTRACTING', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "InterventionWorkTime" (
  "id" TEXT NOT NULL,
  "interventionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dayDate" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "durationMinutes" INTEGER,
  "hourlyCostCents" INTEGER,
  "manual" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterventionWorkTime_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InterventionWorkTime_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InterventionWorkTime_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InterventionWorkTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InterventionWorkTime_interventionId_dayDate_idx" ON "InterventionWorkTime"("interventionId", "dayDate");
CREATE INDEX IF NOT EXISTS "InterventionWorkTime_organizationId_userId_idx" ON "InterventionWorkTime"("organizationId", "userId");

CREATE TABLE IF NOT EXISTS "InterventionExpense" (
  "id" TEXT NOT NULL,
  "interventionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "dayDate" TIMESTAMP(3),
  "amountCents" INTEGER NOT NULL,
  "category" "InterventionExpenseCategory" NOT NULL DEFAULT 'OTHER',
  "supplier" TEXT,
  "description" TEXT,
  "expenseDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterventionExpense_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InterventionExpense_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InterventionExpense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InterventionExpense_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InterventionExpense_interventionId_expenseDate_idx" ON "InterventionExpense"("interventionId", "expenseDate");
CREATE INDEX IF NOT EXISTS "InterventionExpense_organizationId_idx" ON "InterventionExpense"("organizationId");
