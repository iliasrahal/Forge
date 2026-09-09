-- Identité légale de l'entreprise (adresse, SIRET, TVA, APE...), reprise en tête des PDF.
-- Migration additive.
ALTER TABLE "Organization"
    ADD COLUMN IF NOT EXISTS "legalName" TEXT,
    ADD COLUMN IF NOT EXISTS "siret" TEXT,
    ADD COLUMN IF NOT EXISTS "vatNumber" TEXT,
    ADD COLUMN IF NOT EXISTS "apeCode" TEXT,
    ADD COLUMN IF NOT EXISTS "addressStreet" TEXT,
    ADD COLUMN IF NOT EXISTS "addressPostalCode" TEXT,
    ADD COLUMN IF NOT EXISTS "addressCity" TEXT,
    ADD COLUMN IF NOT EXISTS "contactPhone" TEXT,
    ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
