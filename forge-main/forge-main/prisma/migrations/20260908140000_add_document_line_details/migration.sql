-- Sous-détails facultatifs des lignes de devis et facture.
-- Migration additive : aucune ligne ni donnée existante n'est modifiée.
CREATE TABLE IF NOT EXISTS "QuoteLineDetail" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "quoteLineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuoteLineDetail_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuoteLineDetail_quoteLineId_fkey" FOREIGN KEY ("quoteLineId") REFERENCES "QuoteLine"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuoteLineDetail_quoteLineId_position_idx"
    ON "QuoteLineDetail"("quoteLineId", "position");

CREATE TABLE IF NOT EXISTS "InvoiceLineDetail" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "invoiceLineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceLineDetail_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InvoiceLineDetail_invoiceLineId_fkey" FOREIGN KEY ("invoiceLineId") REFERENCES "InvoiceLine"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "InvoiceLineDetail_invoiceLineId_position_idx"
    ON "InvoiceLineDetail"("invoiceLineId", "position");
