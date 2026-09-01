-- Normalisation des anciens statuts d'abonnement vers le nouveau modèle
-- (TRIAL / ACTIVE / ACTIVE_PRO / FREE).

-- Les clients payants restent payants.
UPDATE "User" SET "subscriptionStatus" = 'ACTIVE'
  WHERE "subscriptionStatus" = 'PAID';
UPDATE "Organization" SET "subscriptionStatus" = 'ACTIVE'
  WHERE "subscriptionStatus" = 'PAID';

-- Un membre invité encore dans sa période d'essai repasse en TRIAL.
UPDATE "User" SET "subscriptionStatus" = 'TRIAL'
  WHERE "subscriptionStatus" = 'ORGANIZATION'
    AND "trialEndsAt" IS NOT NULL
    AND "trialEndsAt" > CURRENT_TIMESTAMP;

-- Tout le reste (ORGANIZATION expiré, CANCELED, EXPIRED) devient FREE.
UPDATE "User" SET "subscriptionStatus" = 'FREE'
  WHERE "subscriptionStatus" IN ('ORGANIZATION', 'CANCELED', 'EXPIRED');
UPDATE "Organization" SET "subscriptionStatus" = 'FREE'
  WHERE "subscriptionStatus" IN ('ORGANIZATION', 'CANCELED', 'EXPIRED');
