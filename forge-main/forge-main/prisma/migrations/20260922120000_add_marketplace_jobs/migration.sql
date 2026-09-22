CREATE TYPE "MarketplaceJobStatus" AS ENUM ('OPEN', 'FILLED', 'CLOSED');
CREATE TYPE "MarketplaceApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

CREATE TABLE "MarketplaceJobPosting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "publicDescription" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "positions" INTEGER NOT NULL DEFAULT 1,
    "budgetCents" INTEGER,
    "status" "MarketplaceJobStatus" NOT NULL DEFAULT 'OPEN',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceJobPosting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketplaceJobApplication" (
    "id" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "representedOrganizationId" TEXT,
    "message" TEXT,
    "status" "MarketplaceApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "respondedByUserId" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketplaceJobApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceJobPosting_status_startDate_idx" ON "MarketplaceJobPosting"("status", "startDate");
CREATE INDEX "MarketplaceJobPosting_trade_status_idx" ON "MarketplaceJobPosting"("trade", "status");
CREATE INDEX "MarketplaceJobPosting_location_status_idx" ON "MarketplaceJobPosting"("location", "status");
CREATE INDEX "MarketplaceJobPosting_organizationId_createdAt_idx" ON "MarketplaceJobPosting"("organizationId", "createdAt");
CREATE INDEX "MarketplaceJobPosting_createdByUserId_createdAt_idx" ON "MarketplaceJobPosting"("createdByUserId", "createdAt");
CREATE UNIQUE INDEX "MarketplaceJobApplication_postingId_applicantUserId_key" ON "MarketplaceJobApplication"("postingId", "applicantUserId");
CREATE INDEX "MarketplaceJobApplication_postingId_status_idx" ON "MarketplaceJobApplication"("postingId", "status");
CREATE INDEX "MarketplaceJobApplication_applicantUserId_createdAt_idx" ON "MarketplaceJobApplication"("applicantUserId", "createdAt");
CREATE INDEX "MarketplaceJobApplication_representedOrganizationId_idx" ON "MarketplaceJobApplication"("representedOrganizationId");

ALTER TABLE "MarketplaceJobPosting" ADD CONSTRAINT "MarketplaceJobPosting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceJobPosting" ADD CONSTRAINT "MarketplaceJobPosting_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceJobApplication" ADD CONSTRAINT "MarketplaceJobApplication_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "MarketplaceJobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceJobApplication" ADD CONSTRAINT "MarketplaceJobApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceJobApplication" ADD CONSTRAINT "MarketplaceJobApplication_representedOrganizationId_fkey" FOREIGN KEY ("representedOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketplaceJobApplication" ADD CONSTRAINT "MarketplaceJobApplication_respondedByUserId_fkey" FOREIGN KEY ("respondedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
