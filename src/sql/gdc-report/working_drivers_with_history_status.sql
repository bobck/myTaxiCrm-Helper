SELECT
	DISTINCT ON
	(d.id)
	d.id,
	d.phone,
	d.full_name,
	d.auto_park_id,
	deh.created_at AS start_working_at,
	dehl.created_at AS temporary_leave_at,
	dl.event_time AS fired_out_time,
	COALESCE(dti.integrations,0) AS integrations
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
		ORDER BY
			deh.driver_id,
			deh.created_at DESC
	) dehl ON
	dehl.driver_id = d.id
LEFT JOIN (
		SELECT 
			dti.driver_id,
			COUNT(DISTINCT dti.integration_id) AS integrations
		FROM drivers_to_integrations dti
		LEFT JOIN integrations i ON i.id = dti.integration_id
		WHERE dti.integration_type != 'OFFICE_TRIPS'
		AND i.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
		GROUP BY dti.driver_id
) dti ON dti.driver_id = d.id
WHERE
	d.inner_status = 'WORKING'
	AND d.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
	AND deh.created_at IS NOT NULL
	AND deh.created_at AT TIME ZONE 'europe/kyiv' >= TO_TIMESTAMP ($1 || ' 00:00:00', 'YYYY-MM-DD HH24:MI')
	AND deh.created_at AT TIME ZONE 'europe/kyiv' <= TO_TIMESTAMP ($1 || ' 23:59:59', 'YYYY-MM-DD HH24:MI')
ORDER BY
	d.id,
	dl.event_time DESC