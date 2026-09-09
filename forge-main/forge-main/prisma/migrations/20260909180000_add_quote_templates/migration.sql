-- Modèles de devis réutilisables. Migration additive.

CREATE TABLE IF NOT EXISTS "QuoteTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "vatApplicable" BOOLEAN NOT NULL DEFAULT false,
    "discountBp" INTEGER NOT NULL DEFAULT 0,
    "retentionBp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteTemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuoteTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuoteTemplate_organizationId_idx" ON "QuoteTemplate"("organizationId");

CREATE TABLE IF NOT EXISTS "QuoteTemplateLine" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT,
    "quantityMilli" INTEGER NOT NULL DEFAULT 1000,
    "unit" TEXT NOT NULL DEFAULT 'forfait',
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER,
    "discountBp" INTEGER NOT NULL DEFAULT 0,
    "vatRateBp" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteTemplateLine_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuoteTemplateLine_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuoteTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuoteTemplateLine_templateId_position_idx" ON "QuoteTemplateLine"("templateId", "position");
