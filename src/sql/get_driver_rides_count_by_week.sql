SELECT
  cs.rides_count
FROM
  calculated_statements cs
WHERE
  cs.auto_park_id = $1
  AND cs.driver_id = $2
  AND cs."year" = $3
  AND cs.week = $4