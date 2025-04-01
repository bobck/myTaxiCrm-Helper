with branded_cars as(
    select c.id,c.license_plate from cars c
    where c.license_plate = any($1)
), report_cards as(
    select
        bc.id as car_id,
        count(t.id)as total_trips,
        CASE
            WHEN s.event_type != 'RENTAL' THEN s.driver_id
            ELSE (s.rental_settings -> 'mapping' -> 0 ->> 'driverId')::UUID
            END AS d_id
    from branded_cars bc
             join trips t on bc.id=t.car_id and t.call_date>=$2
             JOIN schedule s ON s.car_id = bc.id
        AND s.is_latest_version = TRUE
        AND s.is_deleted = FALSE
        AND s.event_type IN ('BUSY_WITH_CREW', 'BUSY_WITH_PRIVATE_TRADER', 'RENTAL')
        AND s.event_period_end >= $3
        AND s.parent_id IS NULL
    group by bc.id,d_id
)
SELECT
    d.id AS driver_id,
    d.full_name AS driver_name,
    d.phone,
    d.auto_park_id,
    rc.total_trips,
    bc.license_plate
FROM report_cards rc
         JOIN drivers d ON rc.d_id = d.id
         JOIN branded_cars bc on rc.car_id=bc.id;
