SELECT
  cs.auto_park_id,
  cs.driver_id,
  (d.created_at AT TIME ZONE 'europe/kyiv')::text AS driver_created_at,
  cs.rides_count,
  dl.type as fired_status
FROM
  calculated_statements cs
  LEFT JOIN (
    SELECT DISTINCT
      ON (dl.driver_id) dl.driver_id,
      dl.auto_park_id,
      dl.created_at,
      dl.type
    FROM
      drivers_logs dl
    WHERE
      dl.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
      AND (
        EXTRACT(
          WEEK
          FROM
            dl.created_at AT TIME ZONE 'europe/kyiv'
        ) = $1
        AND EXTRACT(
          YEAR
          FROM
            dl.created_at AT TIME ZONE 'europe/kyiv'
        ) = $2
      )
    ORDER BY
      dl.driver_id,
      dl.created_at DESC
  ) dl ON dl.driver_id = cs.driver_id
  LEFT JOIN drivers d ON d.id = cs.driver_id
WHERE
  cs.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
  AND cs."year" = $2
  AND cs.week = $1
  AND cs.rides_count > 0