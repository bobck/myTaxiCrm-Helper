SELECT
	dl.auto_park_id,
	d.full_name,
	d.phone,
	dl.status,
	dl."comment",
	sum(cs.rides_count) AS rides_count,
	sum(cs.rides_count) FILTER (WHERE cs.week = EXTRACT(week FROM current_date at TIME zone 'europe/kyiv')) AS rides_count_current_week,
	sum(cs.rides_count) FILTER (WHERE cs.week = EXTRACT(week FROM current_date at TIME zone 'europe/kyiv')-1) AS rides_count_prev_week,
	sum(cs.rides_count) FILTER (WHERE cs.week = EXTRACT(week FROM current_date at TIME zone 'europe/kyiv')-2) AS rides_count_two_weeks_ago,
	sum(cs.rides_count) FILTER (WHERE cs.week = EXTRACT(week FROM current_date at TIME zone 'europe/kyiv')-3) AS rides_count_three_weeks_ago,
	round(
		EXTRACT(
			EPOCH
		FROM
			dl.created_at
		)* 1000
	) AS unix_created_at,
	dl.created_at::date - d.created_at::date AS worked_days
FROM
	drivers_logs dl
LEFT JOIN drivers d ON
	d.auto_park_id = dl.auto_park_id
	AND d.id = dl.driver_id
LEFT JOIN calculated_statements cs ON
	cs.auto_park_id = dl.auto_park_id
	AND cs.driver_id = dl.driver_id 
	AND cs.YEAR = EXTRACT(year FROM current_date at TIME zone 'europe/kyiv')
WHERE
	dl."type" = 'FIRED_OUT'
	AND round(
		EXTRACT(
			EPOCH
		FROM
			dl.created_at
		)* 1000
	) > $1
	AND dl.company_id IN (
		'4ea03592-9278-4ede-adf8-f7345a856893', 'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4'
	) 
	AND dl.auto_park_id NOT IN ('58ea1e9e-ebdd-4c4d-870c-6ef06e868c60','de4bf8ba-30c2-452c-a688-104063052961','be6ab23a-d6ba-4add-b0f7-cfb8abd0586b')
GROUP BY 	
	dl.auto_park_id,
	d.full_name,
	d.phone,
	dl.status,
	dl."comment",
	dl.created_at,
	d.created_at 
ORDER BY
	dl.created_at