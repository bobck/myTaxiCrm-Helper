SELECT
  cur.auto_park_id,
  cur.with_driver,
  cur.total_cars,
  cur.with_driver + cur.without_driver AS aviable_cars,
  cur.total_trips
FROM
  car_usage_reports cur
WHERE
  company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
  AND "scale" = 'DAILY'
  AND cur.period_from AT TIME ZONE 'europe/kyiv' >= TO_TIMESTAMP ($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI:SS.MS')
  AND cur.period_to AT TIME ZONE 'europe/kyiv' <= TO_TIMESTAMP ($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI:SS.MS')
