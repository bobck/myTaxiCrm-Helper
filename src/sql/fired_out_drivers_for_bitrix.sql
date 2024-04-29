SELECT
	dl.auto_park_id,
	d.full_name,
	d.phone,
	dl.status,
	dl."comment",
	sum(cs.rides_count) AS rides_count,
	round(
		EXTRACT(
			EPOCH
		FROM
			dl.created_at
		)* 1000
	) AS unix_created_at
FROM
	drivers_logs dl
LEFT JOIN drivers d ON
	d.auto_park_id = dl.auto_park_id
	AND d.id = dl.driver_id
LEFT JOIN calculated_statements cs ON
	cs.auto_park_id = dl.auto_park_id
	AND cs.driver_id = dl.driver_id
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
GROUP BY 	
	dl.auto_park_id,
	d.full_name,
	d.phone,
	dl.status,
	dl."comment",
	dl.created_at
ORDER BY
	dl.created_at