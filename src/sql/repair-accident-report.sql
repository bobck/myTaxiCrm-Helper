SELECT DISTINCT ON (s.car_id)
s.auto_park_id,
c.license_plate,
s.car_id,
s.event_type,
s.id,
  CASE
    WHEN (s.event_period_end AT TIME ZONE 'europe/kyiv') <= TO_TIMESTAMP($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI:SS.MS') THEN TRUE
    ELSE FALSE
  END AS back_to_work,
  CASE
    WHEN (s.event_period_start AT TIME ZONE 'europe/kyiv') >= TO_TIMESTAMP($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI:SS.MS') THEN TRUE
    ELSE FALSE
  END AS work_stopped
FROM
  schedule s
  LEFT JOIN cars c ON c.id = s.car_id
WHERE
  s.is_latest_version = TRUE
  AND s.is_deleted = FALSE
  AND s.event_period_end AT TIME ZONE 'europe/kyiv' >= TO_TIMESTAMP($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI:SS.MS')
  AND s.event_period_start AT TIME ZONE 'europe/kyiv' <= TO_TIMESTAMP($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI:SS.MS')
  AND (
    (s.event_period_end AT TIME ZONE 'europe/kyiv') <= TO_TIMESTAMP($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI:SS.MS')
    OR (s.event_period_start AT TIME ZONE 'europe/kyiv') >= TO_TIMESTAMP($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI:SS.MS')
  )
  AND s.event_type IN ('ON_SERVICE_STATION', 'ROAD_ACCIDENT')
  AND s.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
ORDER BY
  s.car_id,
  s.created_at DESC
