SELECT DISTINCT
	cta.auto_park_id,
	cta.car_id,
	c.license_plate,
	cta.TYPE,
	cta.created_at
FROM
	car_transfer_acceptance cta
LEFT JOIN cars c ON c.id = cta.car_id
WHERE
	cta.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
AND status = 'ACCEPTED'
AND cta.created_at AT TIME ZONE 'europe/kyiv' >= TO_TIMESTAMP ($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI')
AND cta.created_at AT TIME ZONE 'europe/kyiv' <= TO_TIMESTAMP ($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI')
ORDER BY cta.car_id, cta.created_at DESC