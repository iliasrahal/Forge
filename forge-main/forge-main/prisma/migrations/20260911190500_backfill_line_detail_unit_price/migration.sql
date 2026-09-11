-- Rétro-remplit unitPriceCents pour les sous-détails créés avant l'ajout de
-- quantité/unité/PU HT : quantityMilli valant 1000 (défaut) sur ces lignes
-- historiques, unitPriceCents = amountCents préserve exactement le montant
-- déjà affiché (1 × PU HT = amountCents). Idempotent (ne touche que les
-- lignes encore à NULL).

UPDATE "QuoteLineDetail"
    SET "unitPriceCents" = "amountCents"
    WHERE "unitPriceCents" IS NULL AND "amountCents" IS NOT NULL;

UPDATE "InvoiceLineDetail"
    SET "unitPriceCents" = "amountCents"
    WHERE "unitPriceCents" IS NULL AND "amountCents" IS NOT NULL;
