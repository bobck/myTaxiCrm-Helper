SELECT
	COALESCE(SUM(total_trips),0) AS trips
FROM
	driver_report_cards drc
WHERE
	date >= $3
	AND date <= $4
	AND driver_id = $1
	AND auto_park_id = $2