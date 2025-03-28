WITH report_cards AS (
    SELECT DISTINCT ON (t.car_id)
        t.car_id,
        CASE
            WHEN s.event_type != 'RENTAL' THEN s.driver_id
            ELSE (s.rental_settings -> 'mapping' -> 0 ->> 'driverId')::UUID
            END AS d_id,
        COUNT(*) AS total_trips
    FROM trips t
             JOIN integrations i ON t.integration_id = i.id
        AND i.type = 'BOLT'
        AND i.auto_park_id = ANY($1)
             JOIN schedule s ON s.car_id = t.car_id
        AND s.is_latest_version = TRUE
        AND s.is_deleted = FALSE
        AND s.event_type IN ('BUSY_WITH_CREW', 'BUSY_WITH_PRIVATE_TRADER', 'RENTAL')
        AND s.event_period_end > $3
        AND s.parent_id IS NULL
    WHERE t.call_date >= $2
    GROUP BY t.car_id, d_id
)
SELECT
    d.id AS driver_id,
    d.full_name AS driver_name,
    d.phone,
    d.auto_park_id,
    rc.total_trips
FROM report_cards rc
         JOIN drivers d ON rc.d_id = d.id;
