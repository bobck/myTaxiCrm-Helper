SELECT
  dbr.auto_park_id,
  dbr.avg_check_rules,
  dbr.integration_ids,
  dbr.trips_rules
FROM
  driver_bonus_rules dbr
WHERE
  dbr.auto_park_id = ANY($2)
  AND dbr.company_id = $1
  AND dbr.driver_id is null