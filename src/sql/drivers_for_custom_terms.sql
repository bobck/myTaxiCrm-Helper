WITH
  rent_shcedule AS (
    SELECT
      id,
      event_period_start,
      event_period_end,
      (
        jsonb_array_elements (rental_settings -> 'mapping') ->> 'driverId'
      ):: UUID AS rent_driver_id
    FROM
      schedule s
    WHERE
      is_latest_version
      AND NOT is_deleted
      AND event_type = 'RENTAL'
      AND (
        TO_TIMESTAMP ($1 || ' 23:59', 'YYYY-MM-DD HH24:MI') BETWEEN event_period_start AND event_period_end
      )
      AND event_period_end != TO_TIMESTAMP ($1 || ' 23:59', 'YYYY-MM-DD HH24:MI')
  )
SELECT
  d.id,
  d.company_id,
  d.auto_park_id,
  d.full_name,
  d.inner_status,
  d.created_at,
  deh.start_working_at,
  dl.fired_at,
  DATE_PART('day', deh.start_working_at -  dl.fired_at) AS was_fired_days,
  t.is_enabled AS custom_tariff_enabled,
  dbr.created_at AS custom_bonus_created_at,
  rs.id AS rent_event_id
FROM
  drivers d
  LEFT JOIN (
    SELECT DISTINCT
      ON (driver_id) t.driver_id,
      t.is_enabled,
      t.created_at
    FROM
      tariffs t
    WHERE
      type = 'DRIVER_CUSTOM'
    ORDER BY
      driver_id,
      created_at DESC
  ) t ON t.driver_id = d.id
  LEFT JOIN (
    SELECT DISTINCT
      ON (driver_id) deh.driver_id,
      deh.auto_park_id,
      deh.created_at AS start_working_at
    FROM
      drivers_editing_history deh,
		  jsonb_array_elements(diff) AS elem
    WHERE
      elem -> 'fieldName' ->> 'value' = 'inner_status' 
      AND  elem -> 'new' ->> 'value' = 'WORKING' 
      AND ( elem -> 'prev' ->> 'value' = 'WITHOUT_STATUS' OR  elem -> 'prev' ->> 'value' = 'FIRED_OUT' )
      AND jsonb_typeof(diff) = 'array'
    ORDER BY
      deh.driver_id,
      deh.created_at DESC
  ) deh ON deh.driver_id = d.id
  LEFT JOIN (
    SELECT DISTINCT
      ON (driver_id) dl.driver_id,
      dl.auto_park_id,
      dl.created_at AS fired_at
    FROM
      drivers_logs dl
    WHERE
      dl."type" = 'FIRED_OUT'
    ORDER BY
      dl.driver_id,
      dl.created_at DESC
  ) dl ON dl.driver_id = d.id
  LEFT JOIN (
    SELECT
      dbr.driver_id,
      dbr.created_at
    FROM
      driver_bonus_rules dbr
    WHERE
      dbr.driver_id IS NOT NULL
  ) dbr ON dbr.driver_id = d.id
  LEFT JOIN (
    SELECT
      id,
      rent_driver_id
    FROM
      rent_shcedule
  ) rs ON rs.rent_driver_id = d.id
WHERE
  d.inner_status = 'WORKING'
  AND deh.start_working_at BETWEEN TO_TIMESTAMP ($1 || ' 00:00', 'YYYY-MM-DD HH24:MI')
  AND TO_TIMESTAMP ($1 || ' 23:59', 'YYYY-MM-DD HH24:MI')
  AND d.auto_park_id = ANY($3)
  AND d.company_id = $2
