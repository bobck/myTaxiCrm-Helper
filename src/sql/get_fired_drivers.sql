SELECT
    d.id as driver_id,
    d.auto_park_id,
    d.full_name,
    (d.fired_out_at::date)::TEXT AS fire_date
FROM
    drivers d
WHERE d.inner_status = 'FIRED_OUT' AND d.auto_park_id = ANY($1)
ORDER BY
    d.id ASC