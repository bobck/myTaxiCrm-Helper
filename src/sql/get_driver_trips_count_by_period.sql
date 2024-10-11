SELECT
	COALESCE(SUM(total_trips),0) AS trips
FROM
	driver_report_cards drc
WHERE
	period_from AT time ZONE 'europe/kyiv' >= $3
	AND period_from AT time ZONE 'europe/kyiv' <= $4
	AND driver_id = $1
	AND auto_park_id = $2