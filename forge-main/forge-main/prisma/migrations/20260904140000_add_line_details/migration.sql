-- Lignes détaillées : quantité x prix unitaire + unité + remise + déboursé.
-- Extension additive : les lignes existantes deviennent « 1 forfait » au prix
-- courant, remise 0, sans coût — le montant HT ne bouge pas.

-- Lignes de devis.
ALTER TABLE "QuoteLine"
    ADD COLUMN "quantityMilli" INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'forfait',
    ADD COLUMN "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "costCents" INTEGER,
    ADD COLUMN "discountBp" INTEGER NOT NULL DEFAULT 0;

UPDATE "QuoteLine" SET "unitPriceCents" = "amountCents";

-- Lignes de facture.
ALTER TABLE "InvoiceLine"
    ADD COLUMN "quantityMilli" INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'forfait',
    ADD COLUMN "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "costCents" INTEGER,
    ADD COLUMN "discountBp" INTEGER NOT NULL DEFAULT 0;

UPDATE "InvoiceLine" SET "unitPriceCents" = "amountCents";

-- Remise globale + coût total au niveau document.
ALTER TABLE "Quote"
    ADD COLUMN "discountBp" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "totalCostCents" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Invoice"
    ADD COLUMN "discountBp" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "totalCostCents" INTEGER NOT NULL DEFAULT 0;
