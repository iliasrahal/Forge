CREATE TABLE "MarketplaceJobRequirement" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "tradeKey" TEXT NOT NULL,
    "customTradeName" TEXT,
    "requiredCount" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceJobRequirement_pkey" PRIMARY KEY ("id")
);

-- Every legacy posting becomes one equivalent requirement. Existing IDs are
-- deterministic so applications can be backfilled without losing history.
INSERT INTO "MarketplaceJobRequirement" (
  "id", "postingId", "tradeKey", "requiredCount", "startDate", "endDate", "updatedAt"
)
SELECT
  'legacy-' || "id", "id", "trade", "positions", "startDate", "endDate", CURRENT_TIMESTAMP
FROM "MarketplaceJobPosting";

ALTER TABLE "MarketplaceJobApplication" ADD COLUMN "requirementId" TEXT;

UPDATE "MarketplaceJobApplication"
SET "requirementId" = 'legacy-' || "postingId";

ALTER TABLE "MarketplaceJobApplication" ALTER COLUMN "requirementId" SET NOT NULL;

DROP INDEX "MarketplaceJobApplication_postingId_applicantUserId_key";
CREATE UNIQUE INDEX "MarketplaceJobApplication_requirementId_applicantUserId_key"
ON "MarketplaceJobApplication"("requirementId", "applicantUserId");

CREATE INDEX "MarketplaceJobRequirement_postingId_idx" ON "MarketplaceJobRequirement"("postingId");
CREATE INDEX "MarketplaceJobRequirement_tradeKey_startDate_idx" ON "MarketplaceJobRequirement"("tradeKey", "startDate");
CREATE INDEX "MarketplaceJobRequirement_customTradeName_idx" ON "MarketplaceJobRequirement"("customTradeName");
CREATE INDEX "MarketplaceJobApplication_requirementId_status_idx" ON "MarketplaceJobApplication"("requirementId", "status");

ALTER TABLE "MarketplaceJobRequirement" ADD CONSTRAINT "MarketplaceJobRequirement_postingId_fkey"
FOREIGN KEY ("postingId") REFERENCES "MarketplaceJobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketplaceJobApplication" ADD CONSTRAINT "MarketplaceJobApplication_requirementId_fkey"
FOREIGN KEY ("requirementId") REFERENCES "MarketplaceJobRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
