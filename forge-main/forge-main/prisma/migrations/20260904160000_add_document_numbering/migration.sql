-- Numérotation séquentielle conforme : compteur par organisation / nature /
-- année, attribué à la finalisation. Les documents existants gardent leur
-- référence actuelle (aucun renumérotage rétroactif).

CREATE TYPE "DocumentKind" AS ENUM ('QUOTE', 'INVOICE', 'CREDIT_NOTE');

ALTER TABLE "Organization"
    ADD COLUMN "quotePrefix" TEXT NOT NULL DEFAULT 'D',
    ADD COLUMN "invoicePrefix" TEXT NOT NULL DEFAULT 'F',
    ADD COLUMN "creditNotePrefix" TEXT NOT NULL DEFAULT 'AV';

CREATE TABLE "DocumentCounter" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "year" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocumentCounter_organizationId_kind_year_key"
    ON "DocumentCounter"("organizationId", "kind", "year");

ALTER TABLE "DocumentCounter"
    ADD CONSTRAINT "DocumentCounter_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
