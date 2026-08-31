-- Les nouvelles valeurs sont ajoutées dans une migration séparée afin que
-- PostgreSQL puisse les utiliser en toute sécurité dans la migration suivante.
ALTER TYPE "TeamRole" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE "TeamRole" ADD VALUE IF NOT EXISTS 'READ_ONLY';
