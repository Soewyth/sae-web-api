-- Nouveau calcul du score des villes : la note moyenne des reviews compte
-- pour 70 % et le nombre d'événements de la ville rapporte un bonus jusqu'à
-- 30 % (plafonné à 10 événements). Ainsi une ville avec des événements mais
-- sans review n'a plus un score nul.
-- score = (moyenne des notes des événements) * 0.7
--       + (min(nbEvents, 10) / 10) * 5 * 0.3
CREATE OR REPLACE FUNCTION refresh_city_ranking()
RETURNS void AS $$
BEGIN
  DELETE FROM "CityRanking";

  INSERT INTO "CityRanking" ("FK_cityId", "score", "eventCount", "rank", "updatedAt")
  SELECT
    ranked.city_id,
    ranked.score,
    ranked.event_count,
    RANK() OVER (
      ORDER BY ranked.score DESC,
               ranked.event_count DESC,
               ranked.city_name ASC
    ),
    NOW()
  FROM (
    SELECT
      c.id AS city_id,
      c.name AS city_name,
      ROUND(
        (
          COALESCE(s.rating_part, 0) * 0.7
          + (LEAST(COALESCE(s.event_count, 0), 10) / 10.0) * 5 * 0.3
        )::numeric, 2
      )::double precision AS score,
      COALESCE(s.event_count, 0) AS event_count
    FROM "City" c
    LEFT JOIN (
      SELECT
        e."FK_cityId" AS city_id,
        AVG(es.event_score) AS rating_part, -- AVG ignore les événements sans review (NULL)
        COUNT(*) AS event_count
      FROM "Event" e
      LEFT JOIN (
        SELECT r."FK_EventId" AS event_id, AVG(r.rating)::double precision AS event_score
        FROM "UserReview" r
        GROUP BY r."FK_EventId"
      ) es ON es.event_id = e.id
      GROUP BY e."FK_cityId"
    ) s ON s.city_id = c.id
  ) ranked;
END;
$$ LANGUAGE plpgsql;

-- Recalcul immédiat avec la nouvelle formule
SELECT refresh_city_ranking();
