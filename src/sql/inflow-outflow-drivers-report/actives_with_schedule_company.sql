WITH schedule_day AS (
	SELECT 
		COALESCE(
			s.driver_id,
			x.driver_id_rent
		) AS driver_id,
		s.event_period_start,
		s.event_period_end,
		s.auto_park_id,
		s.created_at
	FROM
		schedule s
	LEFT JOIN LATERAL (
			SELECT
				(
					jsonb_array_elements (
						s.rental_settings -> 'mapping'
					) ->> 'driverId'
				)::UUID AS "driver_id_rent"
		) AS x ON
		TRUE
	WHERE
		s.is_deleted = FALSE
		AND s.is_latest_version = TRUE
		AND s.event_type IN ('BUSY_WITH_CREW','BUSY_WITH_PRIVATE_TRADER','RENTAL')
		AND (
			$1 BETWEEN (s.event_period_start AT TIME ZONE 'europe/kyiv')::date AND (s.event_period_end AT TIME ZONE 'europe/kyiv')::date
		)
		AND s.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
)
SELECT
	d.id,
	d.auto_park_id,
	sd.event_period_start
FROM
	drivers d
	LEFT JOIN (
		SELECT 
			s.auto_park_id,
			s.driver_id,
			min(s.event_period_start) AS event_period_start,
			max(s.event_period_end) AS event_period_end,
			min(s.created_at) AS created_at,
			count(*) AS day_events 
		FROM schedule_day s
		GROUP BY s.auto_park_id, s.driver_id
) sd ON sd.driver_id = d.id
WHERE
	d.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
	AND d.inner_status = 'WORKING'