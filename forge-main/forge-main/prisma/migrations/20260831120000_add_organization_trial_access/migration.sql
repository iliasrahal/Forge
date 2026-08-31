ALTER TABLE "User"
ADD COLUMN "trialStartedAt" TIMESTAMP(3);

UPDATE "User"
SET
  "trialStartedAt" = "createdAt",
  "trialEndsAt" = "createdAt" + INTERVAL '30 days'
WHERE "subscriptionStatus" = 'TRIAL';

ALTER TABLE "Organization"
ADD COLUMN "trialStartedAt" TIMESTAMP(3),
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL';

UPDATE "Organization"
SET
  "trialStartedAt" = "createdAt",
  "trialEndsAt" = "createdAt" + INTERVAL '30 days';
