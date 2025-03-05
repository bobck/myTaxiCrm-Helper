SELECT
	cs.company_id ,
	cs.auto_park_id,
	cs.driver_id,
	d.phone,
	sum(cs.auto_park_revenue-(CASE WHEN cs.week = EXTRACT(week FROM current_date AT TIME ZONE 'europe/kyiv') AND cs.YEAR = EXTRACT(YEAR FROM current_date AT TIME ZONE 'europe/kyiv') AND cs.total_debt > 0 THEN cs.total_debt ELSE 0 END )) AS auto_park_revenue,
	sum(cs.rides_count) AS rides_count
FROM
	calculated_statements cs
	LEFT JOIN drivers d ON d.id = cs.driver_id
WHERE
	cs.company_id = ANY($1)
	AND (cs.auto_park_revenue <> 0 OR cs.rides_count <> 0)
	AND cs.year >= $2 and cs.week >= $3
GROUP BY
	cs.company_id ,
	cs.auto_park_id,
	d.phone,
	cs.driver_id