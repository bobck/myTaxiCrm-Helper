SELECT
    d.full_name AS driver_name,
    d.phone,
    drc.total_trips,
    ap.name AS city,
    drc.period_from,
    drc.period_to,
    drc.id AS drc_id,
    d.id AS driver_id,
    ap.id AS auto_park_id
FROM driver_report_cards AS drc
         JOIN drivers AS d ON drc.driver_id = d.id
         JOIN auto_parks AS ap ON d.auto_park_id = ap.id
WHERE drc.period_from >= (
            current_date -1-
            (CASE
                 WHEN EXTRACT(DOW FROM current_date)::int = 0 THEN 7
                 ELSE EXTRACT(DOW FROM current_date)::int
                END)
    )
  AND drc.period_from <= (current_date - INTERVAL '1 day')
  AND d.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
  AND drc.total_trips > 0;
