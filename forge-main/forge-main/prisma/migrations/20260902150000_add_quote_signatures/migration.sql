-- CreateEnum
CREATE TYPE "QuoteSignatureMethod" AS ENUM ('DRAWN');

-- CreateTable
CREATE TABLE "QuoteSignature" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "publicAccessId" TEXT NOT NULL,
    "signerFirstName" TEXT NOT NULL,
    "signerLastName" TEXT NOT NULL,
    "method" "QuoteSignatureMethod" NOT NULL DEFAULT 'DRAWN',
    "signatureData" JSONB NOT NULL,
    "quoteSnapshot" JSONB NOT NULL,
    "integrityHash" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteSignature_quoteId_key" ON "QuoteSignature"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteSignature_publicAccessId_key" ON "QuoteSignature"("publicAccessId");

-- CreateIndex
CREATE INDEX "QuoteSignature_signedAt_idx" ON "QuoteSignature"("signedAt");

-- AddForeignKey
ALTER TABLE "QuoteSignature" ADD CONSTRAINT "QuoteSignature_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteSignature" ADD CONSTRAINT "QuoteSignature_publicAccessId_fkey" FOREIGN KEY ("publicAccessId") REFERENCES "QuotePublicAccess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
