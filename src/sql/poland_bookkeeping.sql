WITH
  drivers_with_income AS (
    SELECT
      drc.driver_id,
      ap.name AS auto_park_name,
      drc.auto_park_id,
      MIN(drc.period_from AT TIME zone 'europe/warsaw') AS period_from,
      MAX(drc.period_to AT TIME zone 'europe/warsaw') AS period_to
    FROM
      driver_report_cards drc
      LEFT JOIN auto_parks ap ON ap.id = drc.auto_park_id
    WHERE
      drc.auto_park_id = $3
      AND drc.total_income > 0
      AND drc.period_from AT TIME zone 'europe/warsaw' >= $1
      AND drc.period_from AT TIME zone 'europe/warsaw' <= $2
    GROUP BY
      drc.driver_id,
      ap.name,
      drc.auto_park_id
  ),
  bill_dates AS (
    SELECT DISTINCT
      ON (ss.car_id, ss.driver_id) ss.car_id,
      dwi.driver_id,
      dwi.auto_park_name,
      dwi.auto_park_id,
      CASE
        WHEN (
          FIRST_VALUE(ss.event_period_start AT TIME zone 'europe/warsaw') OVER w
        ) < $1 THEN $1::DATE
        ELSE (
          FIRST_VALUE(ss.event_period_start AT TIME zone 'europe/warsaw') OVER w
        )::DATE
      END AS bill_period_start,
      CASE
        WHEN (
          LAST_VALUE(ss.event_period_end AT TIME zone 'europe/warsaw') OVER w
        ) > $2 THEN $2::DATE
        ELSE (
          LAST_VALUE(ss.event_period_end AT TIME zone 'europe/warsaw') OVER w
        )::DATE
      END AS bill_period_end
    FROM
      drivers_with_income dwi
      JOIN (
        SELECT
          COALESCE(s.driver_id,x.driver_id_rent) AS driver_id,
          s.event_period_start,
          s.event_period_end,
          s.car_id,
          s.id,
          s.created_at
        FROM
          schedule s
          LEFT JOIN LATERAL (
            SELECT
              (
                jsonb_array_elements (s.rental_settings -> 'mapping') ->> 'driverId'
              )::UUID AS "driver_id_rent"
          ) AS x ON TRUE
        WHERE
          s.is_deleted = FALSE
          AND s.is_latest_version = TRUE
      ) AS ss ON (
        ss.driver_id = dwi.driver_id
      )
      AND (
        ss.event_period_start BETWEEN $1
        AND $2
        OR ss.event_period_end BETWEEN $1
        AND $2
        OR (
          ss.event_period_start <= $1
          AND ss.event_period_end >= $2
        )
      )
    WINDOW
      w AS (
        PARTITION BY
          ss.car_id,
          ss.driver_id
        ORDER BY
          ss.created_at
      )
    ORDER BY
      ss.car_id,
      ss.driver_id,
      ss.created_at DESC
  ),
  car_contract_all_dates AS (
    SELECT
      s2.event_period_start::DATE AS car_contract_date,
      driver_id AS driver_id_2,
      x.driver_id_rent,
      s2.car_id
    FROM
      schedule s2
      LEFT JOIN LATERAL (
        SELECT
          (
            jsonb_array_elements (s2.rental_settings -> 'mapping') ->> 'driverId'
          )::UUID AS "driver_id_rent"
      ) AS x ON TRUE
    WHERE
      s2.is_deleted = FALSE
      AND s2.is_latest_version = TRUE
  ),
  cars_contracts_starts AS (
    SELECT
      MIN(car_contract_date) AS car_contract_start_date,
      COALESCE(driver_id_2, driver_id_rent) AS driver_id,
      car_id
    FROM
      car_contract_all_dates
    GROUP BY
      driver_id,
      car_id
  )
SELECT
  c.license_plate,
  d.full_name AS driver_name,
  bd.bill_period_start::text,
  bd.bill_period_end::text,
  (bd.bill_period_end-bd.bill_period_start) + 1 AS bill_days,
  ccs.car_contract_start_date::text,
  bd.auto_park_name,
  bd.auto_park_id,
  c.model_id,
  c.owner_id,
  co.name AS car_owner_name
FROM
  bill_dates bd
  JOIN drivers d ON d.id = bd.driver_id
  AND bd.bill_period_end != bd.bill_period_start
  JOIN cars c ON c.id = bd.car_id
  LEFT JOIN car_owners co ON co.id = c.owner_id
  JOIN cars_contracts_starts ccs ON ccs.driver_id::uuid = bd.driver_id
  AND bd.car_id = ccs.car_id
ORDER BY
  full_name
