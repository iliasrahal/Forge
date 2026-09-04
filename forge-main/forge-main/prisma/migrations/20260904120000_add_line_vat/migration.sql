-- TVA multi-taux par ligne. Extension additive : tous les documents existants
-- passent en « TVA non applicable » (franchise en base), total HT = montant
-- actuel, TVA = 0 — aucun changement de comportement pour les données en place.

CREATE TYPE "VatScheme" AS ENUM ('SUBJECT', 'FRANCHISE_BASE');

-- Organisation : régime de TVA + taux par défaut (points de base).
ALTER TABLE "Organization"
    ADD COLUMN "vatScheme" "VatScheme" NOT NULL DEFAULT 'FRANCHISE_BASE',
    ADD COLUMN "defaultVatRateBp" INTEGER NOT NULL DEFAULT 2000;

-- Devis.
ALTER TABLE "Quote"
    ADD COLUMN "vatApplicable" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "totalHtCents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "totalVatCents" INTEGER NOT NULL DEFAULT 0;

UPDATE "Quote" SET "totalHtCents" = "amountCents";

ALTER TABLE "QuoteLine"
    ADD COLUMN "vatRateBp" INTEGER NOT NULL DEFAULT 0;

-- Factures.
ALTER TABLE "Invoice"
    ADD COLUMN "vatApplicable" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "totalHtCents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "totalVatCents" INTEGER NOT NULL DEFAULT 0;

UPDATE "Invoice" SET "totalHtCents" = "amountCents";

-- Lignes de facture (figées à la création, comme les lignes de devis).
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "vatRateBp" INTEGER NOT NULL DEFAULT 0,
    "invoiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

ALTER TABLE "InvoiceLine"
    ADD CONSTRAINT "InvoiceLine_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
