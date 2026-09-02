-- Extension additive pour la consultation et l'acceptation publique des devis.
CREATE TYPE "QuoteAcceptanceMethod" AS ENUM ('CLIENT_LINK');

ALTER TABLE "Quote"
ADD COLUMN "acceptedAt" TIMESTAMP(3),
ADD COLUMN "acceptanceMethod" "QuoteAcceptanceMethod";

CREATE TABLE "QuotePublicAccess" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuotePublicAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuotePublicAccess_tokenHash_key"
ON "QuotePublicAccess"("tokenHash");

CREATE INDEX "QuotePublicAccess_quoteId_idx"
ON "QuotePublicAccess"("quoteId");

CREATE INDEX "QuotePublicAccess_quoteId_revokedAt_idx"
ON "QuotePublicAccess"("quoteId", "revokedAt");

ALTER TABLE "QuotePublicAccess"
ADD CONSTRAINT "QuotePublicAccess_quoteId_fkey"
FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
