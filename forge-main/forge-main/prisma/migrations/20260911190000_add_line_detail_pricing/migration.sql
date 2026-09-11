-- Ajoute quantité/unité/prix unitaire aux sous-détails de ligne (devis et
-- facture), pour qu'un détail puisse être une mini-ligne chiffrée
-- (quantité × PU HT) plutôt qu'un simple montant fixe. amountCents reste
-- calculé à partir de ces champs et reste purement informatif : il n'entre
-- jamais dans le total de la ligne parente. Migration additive.

ALTER TABLE "QuoteLineDetail"
    ADD COLUMN IF NOT EXISTS "quantityMilli" INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'forfait',
    ADD COLUMN IF NOT EXISTS "unitPriceCents" INTEGER;

ALTER TABLE "InvoiceLineDetail"
    ADD COLUMN IF NOT EXISTS "quantityMilli" INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'forfait',
    ADD COLUMN IF NOT EXISTS "unitPriceCents" INTEGER;
