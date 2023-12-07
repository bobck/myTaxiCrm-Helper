WITH
  mileage_trip AS (
    SELECT
      cr.mapon_id,
      cr.company_id,
      cr.auto_park_id,
      SUM(cr.mileage) AS mileage
    FROM
      car_routes cr
    WHERE
      cr.trip_id IS NULL
      and (cr.period_to)::date = $1
    GROUP BY
      cr.mapon_id,
      cr.company_id,
      cr.auto_park_id
  ),
  drivers_wog AS (
    SELECT
      ap."name" AS auto_park_name,
      ap.id AS auto_park_id,
      d.id AS driver_id,
      d.full_name,
      c.id AS car_id,
      c.mapon_id,
      c.license_plate,
      CASE
        WHEN d."driver_personal_comment" LIKE '%WOG\:%' THEN REPLACE(
          SUBSTRING(
            d."driver_personal_comment"
            FROM
              'WOG\:\d{16}'
          ),
          'WOG:',
          ''
        )
        ELSE NULL
      END AS wog_card,
      drc.total_income,
      drc.total_trips,
      drc.mapon_mileage,
      mt.mileage AS mileage_no_trips,
      drc.event_types,
      CAST($1 AS DATE)::text AS DATE,
	s.event_period_start as schedule_event_period_start,
	s.event_period_end as schedule_event_period_end,
	drc.period_from as driver_report_card_period_from,
	drc.period_to as driver_report_card_period_to
    FROM
      drivers d
      LEFT JOIN auto_parks ap ON ap.company_id = d.company_id
      AND ap.id = d.auto_park_id
      LEFT JOIN schedule s ON s.driver_id = d.id
      LEFT JOIN cars c ON c.id = s.car_id
      AND c.auto_park_id = d.auto_park_id
      AND c.company_id = d.company_id
      LEFT JOIN driver_report_cards drc ON drc.driver_id = d.id
      LEFT JOIN mileage_trip mt ON mt.mapon_id = c.mapon_id
      AND c.company_id = mt.company_id
      AND c.auto_park_id = mt.auto_park_id
    WHERE
      d.company_id IN (
        '4ea03592-9278-4ede-adf8-f7345a856893',
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4'
      )
      AND s.event_period_start <= $1
      AND s.event_period_end >= $1
      AND s.is_latest_version
      AND NOT s.is_deleted
      AND drc.period_from <= $1
      AND drc.period_to >= $1
  )
SELECT
  *
FROM
  drivers_wog
WHERE
  wog_card IS NOT NULL
