SELECT
	driver_id,
	driver_revenue,
	week,
	"year" 
FROM
	calculated_statements cs
WHERE
	driver_id = ANY($1)
	AND week = $2
	AND "year" = $3