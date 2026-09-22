-- Multi-trade marketplace postings remain backward-compatible with the
-- existing primary `trade` column.
ALTER TABLE "MarketplaceJobPosting"
ADD COLUMN "trades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "MarketplaceJobPosting"
SET "trades" = ARRAY["trade"]
WHERE cardinality("trades") = 0;

CREATE INDEX "MarketplaceJobPosting_trades_idx"
ON "MarketplaceJobPosting" USING GIN ("trades");

CREATE TABLE "MarketplaceJobView" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "viewerUserId" TEXT NOT NULL,
    "firstViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MarketplaceJobView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketplaceJobView_postingId_viewerUserId_key"
ON "MarketplaceJobView"("postingId", "viewerUserId");

CREATE INDEX "MarketplaceJobView_postingId_lastViewedAt_idx"
ON "MarketplaceJobView"("postingId", "lastViewedAt");

CREATE INDEX "MarketplaceJobView_viewerUserId_lastViewedAt_idx"
ON "MarketplaceJobView"("viewerUserId", "lastViewedAt");

ALTER TABLE "MarketplaceJobView"
ADD CONSTRAINT "MarketplaceJobView_postingId_fkey"
FOREIGN KEY ("postingId") REFERENCES "MarketplaceJobPosting"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketplaceJobView"
ADD CONSTRAINT "MarketplaceJobView_viewerUserId_fkey"
FOREIGN KEY ("viewerUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
