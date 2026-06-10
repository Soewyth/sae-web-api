-- Trigger 1 : VAlidation of rating in UserReview between 1 and 5
CREATE OR REPLACE FUNCTION check_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Le rating doit être compris entre 1 et 5, valeur reçue : %', NEW.rating;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_rating
BEFORE INSERT OR UPDATE ON "UserReview"
FOR EACH ROW EXECUTE FUNCTION check_rating();

-- Trigger 2 : Automatic logging of event creation in Log table
CREATE OR REPLACE FUNCTION log_event_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "Log" (id, method, date, "createdAt", "fk_eventId")
  VALUES (gen_random_uuid(), 'POST', NOW(), NOW(), NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_event_insert
AFTER INSERT ON "Event"
FOR EACH ROW EXECUTE FUNCTION log_event_insert();

-- Trigger 3 : Automatic logging of UserReview creation in Log table
CREATE OR REPLACE FUNCTION log_review_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "Log" (id, method, date, "createdAt", "fk_reviewId", "FK_userId")
  VALUES (gen_random_uuid(), 'POST', NOW(), NOW(), NEW.id, NEW."FK_userId");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_review_insert
AFTER INSERT ON "UserReview"
FOR EACH ROW EXECUTE FUNCTION log_review_insert();