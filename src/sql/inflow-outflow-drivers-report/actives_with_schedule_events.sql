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
	DISTINCT ON
	(d.id)
	d.id,
	d.auto_park_id,
	deh.created_at AS start_working_at,
	dehl.created_at AS temporary_leave_at,
	dl.event_time AS fired_out_time,
	sd.day_events,
	sd.event_period_start
FROM
	drivers d
LEFT JOIN drivers_logs dl ON
	dl.driver_id = d.id
	AND dl."type" = 'FIRED_OUT'
LEFT JOIN (
		SELECT
			DISTINCT
      ON
			(driver_id) 
      deh.driver_id,
			deh.auto_park_id,
			deh.created_at
		FROM
			drivers_editing_history deh,
			jsonb_array_elements(diff) AS elem
		WHERE
			elem -> 'fieldName' ->> 'translation' = 'common.status'
			AND elem -> 'new' ->> 'translation' = 'common.working'
			AND jsonb_typeof(diff) = 'array'
			AND deh.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
		ORDER BY
			deh.driver_id,
			deh.created_at DESC
	) deh ON
	deh.driver_id = d.id
LEFT JOIN (
		SELECT
			DISTINCT
      ON
			(driver_id) 
      deh.driver_id,
			deh.auto_park_id,
			deh.created_at
		FROM
			drivers_editing_history deh,
			jsonb_array_elements(diff) AS elem
		WHERE
			elem -> 'fieldName' ->> 'translation' = 'common.status'
			AND elem -> 'new' ->> 'translation' = 'common.temporaryLeave'
			AND jsonb_typeof(diff) = 'array'
			AND deh.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
			AND (deh.created_at AT TIME ZONE 'europe/kyiv')::date <= $1
		ORDER BY
			deh.driver_id,
			deh.created_at DESC
	) dehl ON dehl.driver_id = d.id
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
	AND deh.created_at IS NOT NULL
	AND (deh.created_at AT TIME ZONE 'europe/kyiv')::date = $1
	AND (sd.event_period_start AT TIME ZONE 'europe/kyiv')::date = $1
	AND (sd.event_period_start IS NULL or sd.event_period_start != TO_TIMESTAMP ($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI:SS.MS'))
ORDER BY
	d.id,
	dl.event_time DESC