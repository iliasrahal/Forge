-- Bibliothèque de prestations, isolée par workspace (Organization).
CREATE TYPE "ServicePricingType" AS ENUM ('FIXED', 'HOURLY', 'UNIT');

CREATE TABLE "ServiceCatalogItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "pricingType" "ServicePricingType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceCatalogItem_organizationId_idx"
ON "ServiceCatalogItem"("organizationId");

CREATE INDEX "ServiceCatalogItem_organizationId_name_idx"
ON "ServiceCatalogItem"("organizationId", "name");

ALTER TABLE "ServiceCatalogItem"
ADD CONSTRAINT "ServiceCatalogItem_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
