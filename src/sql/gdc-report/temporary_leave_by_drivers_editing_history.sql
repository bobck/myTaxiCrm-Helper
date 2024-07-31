WITH
  returned_new AS (
    SELECT DISTINCT
      ON (driver_id) deh.driver_id,
      deh.auto_park_id,
      deh.created_at,
      elem -> 'new' ->> 'translation' AS elem_new
    FROM
      drivers_editing_history deh,
      jsonb_array_elements (diff) AS elem
    WHERE
      (
        elem -> 'fieldName' ->> 'translation' = 'common.status'
        OR elem -> 'fieldName' ->> 'value' = 'inner_status'
      )
      AND (
        elem -> 'prev' ->> 'translation' = 'common.temporaryLeave'
        OR elem -> 'prev' ->> 'value' = 'TEMPORARY_LEAVE'
      )
      AND jsonb_typeof (diff) = 'array'
      AND company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
      AND (
        created_at AT TIME ZONE 'europe/kyiv' BETWEEN  TO_TIMESTAMP ($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI') AND TO_TIMESTAMP ($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI')
      )
    ORDER BY
      deh.driver_id,
      deh.created_at DESC
  ),
  returned_old AS (
    SELECT DISTINCT
      ON (driver_id) deh.driver_id,
      deh.auto_park_id,
      deh.created_at,
      deh.diff -> 'inner_status' ->> 'new' AS diff_new
    FROM
      drivers_editing_history deh
    WHERE
      deh.diff -> 'inner_status' ->> 'prev' = 'TEMPORARY_LEAVE'
      AND jsonb_typeof (diff) = 'object'
      AND company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
      AND (
        created_at AT TIME ZONE 'europe/kyiv' BETWEEN  TO_TIMESTAMP ($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI') AND TO_TIMESTAMP ($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI')
      )
    ORDER BY
      deh.driver_id,
      deh.created_at DESC
  ) (
    SELECT DISTINCT
      ON (driver_id) deh.driver_id,
      deh.auto_park_id,
      deh.created_at,
      r.elem_new AS returned_status
    FROM
      drivers_editing_history deh
      LEFT JOIN returned_new r ON r.driver_id = deh.driver_id
      AND r.created_at > deh.created_at,
      jsonb_array_elements (diff) AS elem
    WHERE
      (
        elem -> 'fieldName' ->> 'translation' = 'common.status'
        OR elem -> 'fieldName' ->> 'value' = 'inner_status'
      )
      AND (
        elem -> 'new' ->> 'translation' = 'common.temporaryLeave'
        OR elem -> 'new' ->> 'value' = 'TEMPORARY_LEAVE'
      )
      AND jsonb_typeof (diff) = 'array'
      AND company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
      AND deh.created_at AT TIME ZONE 'europe/kyiv' BETWEEN  TO_TIMESTAMP ($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI') AND TO_TIMESTAMP ($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI')
    ORDER BY
      deh.driver_id,
      deh.created_at DESC
  )
UNION ALL
(
  SELECT DISTINCT
    ON (driver_id) deh.driver_id,
    deh.auto_park_id,
    deh.created_at,
    r.diff_new AS returned_status
  FROM
    drivers_editing_history deh
    LEFT JOIN returned_old r ON r.driver_id = deh.driver_id
    AND r.created_at > deh.created_at
  WHERE
    deh.diff -> 'inner_status' ->> 'new' = 'TEMPORARY_LEAVE'
    AND jsonb_typeof (deh.diff) = 'object'
    AND deh.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
    AND (
      deh.created_at AT TIME ZONE 'europe/kyiv' BETWEEN  TO_TIMESTAMP ($1 || ' 00:00:00.000', 'YYYY-MM-DD HH24:MI') AND TO_TIMESTAMP ($1 || ' 23:59:59.999', 'YYYY-MM-DD HH24:MI')
    )
)
