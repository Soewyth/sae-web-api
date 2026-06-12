-- CreateTable : classement des villes (matérialisé, maintenu par trigger)
CREATE TABLE "CityRanking" (
    "FK_cityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CityRanking_pkey" PRIMARY KEY ("FK_cityId")
);

-- AddForeignKey
ALTER TABLE "CityRanking" ADD CONSTRAINT "CityRanking_FK_cityId_fkey" FOREIGN KEY ("FK_cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fonction : recalcule entièrement le classement des villes.
-- Le score d'un événement est la moyenne de ses reviews (rating 1-5).
-- Le score d'une ville est la moyenne des scores de ses événements notés
-- (les événements sans review ne comptent pas dans la moyenne mais sont
-- comptés dans "eventCount").
CREATE OR REPLACE FUNCTION refresh_city_ranking()
RETURNS void AS $$
BEGIN
  DELETE FROM "CityRanking";

  INSERT INTO "CityRanking" ("FK_cityId", "score", "eventCount", "rank", "updatedAt")
  SELECT
    c.id,
    COALESCE(s.city_score, 0),
    COALESCE(s.event_count, 0),
    RANK() OVER (
      ORDER BY COALESCE(s.city_score, 0) DESC,
               COALESCE(s.event_count, 0) DESC,
               c.name ASC
    ),
    NOW()
  FROM "City" c
  LEFT JOIN (
    SELECT
      e."FK_cityId" AS city_id,
      AVG(es.event_score) AS city_score, -- AVG ignore les événements sans review (NULL)
      COUNT(*) AS event_count
    FROM "Event" e
    LEFT JOIN (
      SELECT r."FK_EventId" AS event_id, AVG(r.rating)::double precision AS event_score
      FROM "UserReview" r
      GROUP BY r."FK_EventId"
    ) es ON es.event_id = e.id
    GROUP BY e."FK_cityId"
  ) s ON s.city_id = c.id;
END;
$$ LANGUAGE plpgsql;

-- Trigger 4 : recalcul du classement à chaque changement d'événement,
-- de review ou de ville (statement-level : un seul recalcul par requête SQL)
CREATE OR REPLACE FUNCTION trigger_refresh_city_ranking()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_city_ranking();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_ranking_event
AFTER INSERT OR UPDATE OR DELETE ON "Event"
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_city_ranking();

CREATE TRIGGER trg_refresh_ranking_review
AFTER INSERT OR UPDATE OR DELETE ON "UserReview"
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_city_ranking();

CREATE TRIGGER trg_refresh_ranking_city
AFTER INSERT OR DELETE ON "City"
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_city_ranking();

-- Remplissage initial du classement avec les données existantes
SELECT refresh_city_ranking();
