WITH car_transfer_acceptance_company AS (
	SELECT DISTINCT ON (cta.car_id)
		cta.auto_park_id,
		cta.car_id,
		cta.TYPE
	FROM
		car_transfer_acceptance cta
	LEFT JOIN cars c ON c.id = cta.car_id
	WHERE
		cta.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
	AND status = 'ACCEPTED'
	AND TYPE = 'PARK_TO_DRIVER'
	AND cta.created_at AT TIME ZONE 'europe/kyiv' <= TO_TIMESTAMP ($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI')
	ORDER BY cta.car_id, cta.created_at desc
) 
SELECT
	cta.auto_park_id,
	count(cta.car_id) AS cars
FROM
	car_transfer_acceptance_company cta
GROUP BY cta.auto_park_id, cta.TYPE