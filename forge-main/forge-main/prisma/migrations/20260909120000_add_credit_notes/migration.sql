-- Avoirs (notes de crédit) rattachés à une facture.
-- Migration additive : aucune facture ni donnée existante n'est modifiée.

CREATE TYPE "CreditNoteStatus" AS ENUM ('BROUILLON', 'EMISE', 'ANNULEE');
CREATE TYPE "CreditNoteMode" AS ENUM ('FULL', 'PARTIAL');

CREATE TABLE IF NOT EXISTS "CreditNote" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mode" "CreditNoteMode" NOT NULL DEFAULT 'PARTIAL',
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'BROUILLON',
    "reason" TEXT,
    "vatApplicable" BOOLEAN NOT NULL DEFAULT false,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "totalHtCents" INTEGER NOT NULL DEFAULT 0,
    "totalVatCents" INTEGER NOT NULL DEFAULT 0,
    "discountBp" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreditNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreditNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CreditNote_reference_key" ON "CreditNote"("reference");
CREATE INDEX IF NOT EXISTS "CreditNote_invoiceId_idx" ON "CreditNote"("invoiceId");
CREATE INDEX IF NOT EXISTS "CreditNote_organizationId_idx" ON "CreditNote"("organizationId");
CREATE INDEX IF NOT EXISTS "CreditNote_clientId_idx" ON "CreditNote"("clientId");

CREATE TABLE IF NOT EXISTS "CreditNoteLine" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT,
    "quantityMilli" INTEGER NOT NULL DEFAULT 1000,
    "unit" TEXT NOT NULL DEFAULT 'forfait',
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    "discountBp" INTEGER NOT NULL DEFAULT 0,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "vatRateBp" INTEGER NOT NULL DEFAULT 0,
    "creditNoteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditNoteLine_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CreditNoteLine_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "CreditNote"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CreditNoteLine_creditNoteId_idx" ON "CreditNoteLine"("creditNoteId");
