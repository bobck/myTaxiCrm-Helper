SELECT
    d.id as driver_id,
    d.auto_park_id,
    d.full_name,
    (d.fired_out_at::date)::TEXT AS fire_date,
    cs.balance AS current_week_balance,
    cs.total_deposit AS current_week_total_deposit,
    cs.total_debt AS current_week_total_debt
FROM
    drivers d JOIN calculated_statements cs ON d.id=cs.driver_id
        AND (cs.balance+cs.total_deposit)<0
        AND cs.year = EXTRACT(YEAR FROM current_date)
        AND cs.week = EXTRACT(week FROM current_date)
WHERE d.inner_status = 'FIRED_OUT' AND d.auto_park_id = ANY($1)
        AND d.id!= ALL($2)
ORDER BY
    d.id ASC