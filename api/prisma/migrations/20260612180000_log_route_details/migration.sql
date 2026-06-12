-- Journalisation des appels API : on enregistre désormais la route appelée
-- et les paramètres de la requête (query string et corps, mot de passe masqué)
ALTER TABLE "Log" ADD COLUMN "route" TEXT;
ALTER TABLE "Log" ADD COLUMN "details" JSONB;
