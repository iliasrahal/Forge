-- Fondation progressive des espaces de travail Forge, après ajout des rôles.
-- Les anciens rôles TECHNICIAN sont volontairement conservés jusqu'à leur
-- audit sur la base réelle. MANAGER peut être migré sans perte vers ADMIN.

CREATE TYPE "OrganizationType" AS ENUM ('PERSONAL', 'TEAM');

ALTER TABLE "Organization"
  ADD COLUMN "type" "OrganizationType" NOT NULL DEFAULT 'TEAM',
  ADD COLUMN "personalOwnerId" TEXT;

ALTER TABLE "Session"
  ADD COLUMN "activeOrganizationId" TEXT;

-- Les champs userId deviennent des traces d'auteur et non la propriété des
-- données partagées. Un membre peut quitter une équipe sans supprimer ses données.
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_userId_fkey";
ALTER TABLE "Client" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Client"
  ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Intervention" DROP CONSTRAINT IF EXISTS "Intervention_userId_fkey";
ALTER TABLE "Intervention"
  ADD CONSTRAINT "Intervention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Organization_personalOwnerId_key"
  ON "Organization"("personalOwnerId");
CREATE INDEX "Session_activeOrganizationId_idx"
  ON "Session"("activeOrganizationId");

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_personalOwnerId_fkey"
  FOREIGN KEY ("personalOwnerId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_activeOrganizationId_fkey"
  FOREIGN KEY ("activeOrganizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Un espace personnel déterministe est créé pour chaque compte existant.
INSERT INTO "Organization" (
  "id",
  "name",
  "type",
  "personalOwnerId",
  "trialStartedAt",
  "trialEndsAt",
  "subscriptionStatus",
  "createdAt",
  "updatedAt"
)
SELECT
  'personal_' || u."id",
  u."firstName" || ' — Personnel',
  'PERSONAL'::"OrganizationType",
  u."id",
  u."trialStartedAt",
  u."trialEndsAt",
  u."subscriptionStatus",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1
  FROM "Organization" o
  WHERE o."personalOwnerId" = u."id"
);

INSERT INTO "OrganizationMember" (
  "id",
  "role",
  "userId",
  "organizationId",
  "createdAt",
  "updatedAt"
)
SELECT
  'personal_member_' || u."id",
  'OWNER'::"TeamRole",
  u."id",
  o."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" u
JOIN "Organization" o ON o."personalOwnerId" = u."id"
ON CONFLICT ("userId", "organizationId") DO NOTHING;

-- Les données personnelles historiques rejoignent l'espace personnel.
UPDATE "Client" c
SET "organizationId" = o."id"
FROM "Organization" o
WHERE c."organizationId" IS NULL
  AND o."personalOwnerId" = c."userId";

UPDATE "Intervention" i
SET "organizationId" = c."organizationId"
FROM "Client" c
WHERE i."organizationId" IS NULL
  AND i."clientId" = c."id"
  AND c."organizationId" IS NOT NULL;

UPDATE "Intervention" i
SET "organizationId" = o."id"
FROM "Organization" o
WHERE i."organizationId" IS NULL
  AND i."userId" IS NOT NULL
  AND o."personalOwnerId" = i."userId";

UPDATE "Quote" q
SET "organizationId" = c."organizationId"
FROM "Client" c
WHERE q."organizationId" IS NULL
  AND q."clientId" = c."id";

UPDATE "Invoice" f
SET "organizationId" = c."organizationId"
FROM "Client" c
WHERE f."organizationId" IS NULL
  AND f."clientId" = c."id";

UPDATE "Session" s
SET "activeOrganizationId" = o."id"
FROM "Organization" o
WHERE s."activeOrganizationId" IS NULL
  AND o."personalOwnerId" = s."userId";

-- MANAGER possède déjà une sémantique d'administration.
UPDATE "OrganizationMember"
SET "role" = 'ADMIN'::"TeamRole"
WHERE "role" = 'MANAGER'::"TeamRole";

-- Garde-fou documentaire : ne jamais supprimer TECHNICIAN sans exécuter
-- SELECT COUNT(*) FROM "OrganizationMember" WHERE role = 'TECHNICIAN';
