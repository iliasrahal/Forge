ALTER TABLE "Intervention" ADD COLUMN "userId" TEXT;

UPDATE "Intervention"
SET "userId" = "Client"."userId"
FROM "Client"
WHERE "Intervention"."clientId" = "Client"."id";

ALTER TABLE "Intervention" ALTER COLUMN "clientId" DROP NOT NULL;

ALTER TABLE "Intervention" DROP CONSTRAINT IF EXISTS "Intervention_clientId_fkey";

ALTER TABLE "Intervention"
ADD CONSTRAINT "Intervention_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Intervention"
ADD CONSTRAINT "Intervention_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Intervention_userId_idx" ON "Intervention"("userId");
