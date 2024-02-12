SELECT
  d.id,
  d.company_id,
  d.auto_park_id,
  d.full_name,
  d.inner_status,
  d.created_at,
  deh.start_working_at,
  dl.fired_at,
  EXTRACT(
    days
    FROM
      AGE (CURRENT_TIMESTAMP, dl.fired_at)
  ) AS was_fider_days,
  t.is_enabled
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
      drivers_editing_history deh
    WHERE
      deh.diff -> 'inner_status' ->> 'new' = 'WORKING'
      AND (
        deh.diff -> 'inner_status' ->> 'prev' = 'WITHOUT_STATUS'
        OR deh.diff -> 'inner_status' ->> 'prev' = 'FIRED_OUT'
      )
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
WHERE
  d.inner_status = 'WORKING'
  AND (
    t.is_enabled = 'false'
    OR t.is_enabled IS NULL
  )
  AND dbr.created_at IS NULL
  AND (
    dl.fired_at IS NULL
    OR EXTRACT(
      days
      FROM
        AGE (CURRENT_TIMESTAMP, dl.fired_at)
    ) >= 14
  )
  AND deh.start_working_at BETWEEN TO_TIMESTAMP ($1 || ' 00:00', 'YYYY-MM-DD HH24:MI')
  AND TO_TIMESTAMP ($1 || ' 23:59', 'YYYY-MM-DD HH24:MI')
  AND d.auto_park_id = ANY($3)
  AND d.company_id = $2
