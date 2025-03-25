select
    distinct on (t.car_id)
    t.car_id,
    CASE
    WHEN s.event_type != 'RENTAL' THEN s.driver_id
    ELSE (s.rental_settings->'mapping'->0->>'driverId')::UUID
END AS driver_id,
        count(*) as total_trips
from trips t
    join integrations i on t.integration_id=i.id
    join schedule s on s.car_id=t.car_id
                           AND s.is_latest_version=true and is_deleted=false
                           and (s.event_type in ('BUSY_WITH_CREW','BUSY_WITH_PRIVATE_TRADER','RENTAL'))
                           and s.event_period_end>'2025-03-25'
                           and s.parent_id is null
where t.call_date >= '2025-03-24' AND i.type='BOLT'
group by
        t.car_id,
         CASE WHEN s.event_type != 'RENTAL'
             THEN s.driver_id
        ELSE (s.rental_settings->'mapping'->0->>'driverId')::UUID
END
    order by t.car_id