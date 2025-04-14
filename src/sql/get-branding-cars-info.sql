with branded_cars AS(
    SELECT c.id,c.license_plate FROM cars c
    WHERE c.license_plate = ANY($1)
        AND c.company_id='4ea03592-9278-4ede-adf8-f7345a856893'
), report_cards AS(
    SELECT
        bc.id AS car_id,
        count(t.id) AS total_trips,
        CASE
            WHEN s.event_type != 'RENTAL' THEN s.driver_id
            ELSE (s.rental_settings -> 'mapping' -> 0 ->> 'driverId')::UUID
            END AS branded_car_driver_id
    FROM branded_cars bc
             JOIN trips t ON bc.id=t.car_id AND t.call_date>=$2
             JOIN integrations i ON t.integration_id=i.id AND i.type='BOLT'
             JOIN schedule s ON s.car_id = bc.id
        AND s.is_latest_version = TRUE
        AND s.is_deleted = FALSE
        AND s.event_type IN ('BUSY_WITH_CREW', 'BUSY_WITH_PRIVATE_TRADER', 'RENTAL')
        AND s.event_period_start <= now()
        AND s.event_period_end >= now()
        AND s.parent_id IS NULL
    GROUP BY bc.id,branded_car_driver_id
)
SELECT
    d.id AS driver_id,
    d.full_name AS driver_name,
    d.phone,
    d.auto_park_id,
    rc.total_trips,
    bc.license_plate
FROM report_cards rc
         JOIN drivers d ON rc.branded_car_driver_id = d.id
         JOIN branded_cars bc on rc.car_id=bc.id;
