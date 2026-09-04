-- Encaissement des factures : paiements (Stripe + manuel), Connect côté
-- organisation, lien public de facture, idempotence des webhooks.
-- Extension additive : aucune facture existante n'est modifiée.

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELED');
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'MANUAL');

ALTER TABLE "Organization"
    ADD COLUMN "stripeAccountId" TEXT,
    ADD COLUMN "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "stripeOnboardedAt" TIMESTAMP(3);

ALTER TABLE "Invoice"
    ADD COLUMN "paidAt" TIMESTAMP(3),
    ADD COLUMN "paymentMethod" TEXT;

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "netCents" INTEGER NOT NULL DEFAULT 0,
    "refundedCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MANUAL',
    "method" TEXT,
    "reference" TEXT,
    "errorMessage" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "recordedByUserId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key" ON "Payment"("stripeCheckoutSessionId");
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "Payment_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accountId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoicePublicAccess" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoicePublicAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvoicePublicAccess_tokenHash_key" ON "InvoicePublicAccess"("tokenHash");
CREATE INDEX "InvoicePublicAccess_invoiceId_idx" ON "InvoicePublicAccess"("invoiceId");
CREATE INDEX "InvoicePublicAccess_invoiceId_revokedAt_idx" ON "InvoicePublicAccess"("invoiceId", "revokedAt");

ALTER TABLE "InvoicePublicAccess"
    ADD CONSTRAINT "InvoicePublicAccess_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
