SELECT
    d.id AS driver_id,
    d.full_name AS driver_name,
    d.phone,
    ap.id as auto_park_id,
    SUM(drc.total_trips) AS total_trips
FROM driver_report_cards AS drc
         JOIN drivers AS d ON drc.driver_id = d.id
         JOIN auto_parks AS ap ON d.auto_park_id = ap.id
WHERE drc.period_from >= $1 AND drc.period_from <= $2
        AND ap.country_code = 'UA'
        AND d.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
        AND drc.total_trips > 0
GROUP BY d.id, d.full_name, d.phone, ap.id;
