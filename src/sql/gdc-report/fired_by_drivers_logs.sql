SELECT DISTINCT
  ON (dl.driver_id) dl.driver_id,
  dl.auto_park_id,
  dl.event_time,
  dll.TYPE AS is_restored
FROM
  drivers_logs dl
  LEFT JOIN drivers_logs dll ON dll.driver_id = dl.driver_id
  AND (
    dll.event_time BETWEEN TO_TIMESTAMP ($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI')
    AND TO_TIMESTAMP ($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI')
  )
  AND dll.event_time > dl.event_time
  AND dll.type = 'RESTORED'
WHERE
  dl.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
  AND dl."type" = 'FIRED_OUT'
  AND dl.event_time AT TIME ZONE 'europe/kyiv' >= TO_TIMESTAMP ($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI')
  AND dl.event_time AT TIME ZONE 'europe/kyiv' <= TO_TIMESTAMP ($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI')
ORDER BY
  dl.driver_id,
  dl.event_time DESC
