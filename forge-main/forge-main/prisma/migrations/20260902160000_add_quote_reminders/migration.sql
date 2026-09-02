-- CreateEnum
CREATE TYPE "QuoteReminderChannel" AS ENUM ('EMAIL');

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "sentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QuoteReminder" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "channel" "QuoteReminderChannel" NOT NULL DEFAULT 'EMAIL',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteReminder_quoteId_sentAt_idx" ON "QuoteReminder"("quoteId", "sentAt");

-- CreateIndex
CREATE INDEX "QuoteReminder_createdByUserId_idx" ON "QuoteReminder"("createdByUserId");

-- AddForeignKey
ALTER TABLE "QuoteReminder" ADD CONSTRAINT "QuoteReminder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteReminder" ADD CONSTRAINT "QuoteReminder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
