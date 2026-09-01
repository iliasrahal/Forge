-- Sursis avant suppression d'une équipe dont tous les membres sont FREE.
ALTER TABLE "Organization" ADD COLUMN "graceExpiresAt" TIMESTAMP(3);
