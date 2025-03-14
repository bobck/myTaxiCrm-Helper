SELECT
    d.id AS driver_id,
    d.full_name AS driver_name,
    d.phone,
    ap.id AS auto_park_id,
    SUM((jsonb_data.value->>'totalTrips')::INTEGER) AS total_trips  -- Extract and sum totalTrips
FROM driver_report_cards AS drc
         JOIN drivers AS d ON drc.driver_id = d.id
         JOIN auto_parks AS ap ON d.auto_park_id = ap.id
         CROSS JOIN LATERAL jsonb_each(drc.integration_details) AS jsonb_data  -- Correct LATERAL usage
WHERE drc.period_from >= $1 AND drc.period_to<=$2
  AND ap.country_code = 'UA'
  AND d.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
  AND drc.total_trips > 0
  and jsonb_data.value->>'vendor'='BOLT'
GROUP BY d.id, d.full_name, d.phone, ap.id;
