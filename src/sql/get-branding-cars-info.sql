with report_cards as
    (select distinct on (t.car_id) t.car_id,
                                    CASE
                                        WHEN s.event_type != 'RENTAL' THEN s.driver_id
                                        ELSE (s.rental_settings -> 'mapping' -> 0 ->> 'driverId')::UUID
                                        END  AS d_id,
                                    count(*) as total_trips
      from trips t
        join integrations i on t.integration_id = i.id
          AND i.type = 'BOLT'
          AND i.auto_park_id =any($1)
        join schedule s on s.car_id = t.car_id
          AND s.is_latest_version = true and is_deleted = false
          and (s.event_type in ('BUSY_WITH_CREW', 'BUSY_WITH_PRIVATE_TRADER', 'RENTAL'))
          and s.event_period_end > $3
          and s.parent_id is null
      where t.call_date >= $2
      group by t.car_id, d_id
      )
select d.id as driver_id,
        d.full_name as driver_name,
        d.phone,
        d.auto_park_id,
        rc.total_trips
       from report_cards rc join drivers d on rc.d_id =d.id
