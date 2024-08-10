SELECT
	cr.period_from,
	cr.period_to,
	cr.id AS route_id,
	cr.trip_id,
	cr.mileage,
	c.mapon_id,
	c.license_plate,
	ap."name" as auto_park_name,
	s.driver_id,
	d.full_name as driver_name,
	ctap.auto_park_id
FROM
	car_routes cr
INNER JOIN cars c ON
	c.id = cr.car_id
INNER JOIN cars_to_auto_parks ctap ON
		c.id = ctap.car_id
INNER JOIN auto_parks ap ON
	ap.id = ctap.auto_park_id
LEFT JOIN schedule s ON
	c.id = s.car_id
	AND s.is_latest_version
	AND NOT s.is_deleted
	AND (
		s.event_period_start BETWEEN period_from AND period_to
			OR s.event_period_end BETWEEN period_from AND period_to
			OR (
				s.event_period_start <= period_from
					AND s.event_period_end >= period_to
			)
	)
INNER JOIN drivers d ON
	s.driver_id = d.id
WHERE
	c.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
	AND ctap.auto_park_id NOT IN (
		'499e334b-8916-42ab-b41a-0f0b979d6f69', 'de4bf8ba-30c2-452c-a688-104063052961', '58ea1e9e-ebdd-4c4d-870c-6ef06e868c60', 'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b','034c4a4e-577e-45f8-9360-0631bf78ed4b'
	)
	AND ((cr.period_from AT TIME ZONE 'europe/kyiv')::date)::text = $1