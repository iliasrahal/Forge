-- Logo d'entreprise (data URL) affiché en tête des documents PDF.
-- Migration additive.
ALTER TABLE "Organization"
    ADD COLUMN IF NOT EXISTS "logoDataUrl" TEXT;
