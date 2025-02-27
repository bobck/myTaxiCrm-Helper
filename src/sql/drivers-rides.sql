SELECT
    d.id AS driver_id,
    d.full_name AS driver_name,
    d.phone,
    ap.name AS city,
    ap.id as auto_park_id,
    min(drc.period_from) as period_from,
    max(drc.period_to) as period_to,
    SUM(drc.total_trips) AS total_trips
FROM driver_report_cards AS drc
         JOIN drivers AS d ON drc.driver_id = d.id
         JOIN auto_parks AS ap ON d.auto_park_id = ap.id
WHERE drc.period_from >= (
            current_date - 1 -
            (CASE
                 WHEN EXTRACT(DOW FROM current_date)::int = 0 THEN 7
                 ELSE EXTRACT(DOW FROM current_date)::int
                END)
    )
  AND ap.country_code='UA'
  AND drc.period_from <= (current_date - INTERVAL '1 day')
  AND d.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
  AND drc.total_trips > 0

GROUP BY d.id, d.full_name, d.phone, ap.name, ap.id;
