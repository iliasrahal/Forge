-- Autorise la préparation d'un devis avant son rattachement à un client.
-- Les devis existants et leurs clientId sont intégralement conservés.
ALTER TABLE "Quote"
  ALTER COLUMN "clientId" DROP NOT NULL;

-- Un devis ne doit plus être supprimé automatiquement avec sa fiche client.
ALTER TABLE "Quote"
  DROP CONSTRAINT IF EXISTS "Quote_clientId_fkey";

ALTER TABLE "Quote"
  ADD CONSTRAINT "Quote_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
