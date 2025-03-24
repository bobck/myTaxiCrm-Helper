WITH fired_drivers AS (
    SELECT
        DISTINCT ON
        (d.id)
        d.id,
        d.auto_park_id,
        d.full_name,
        d.fired_out_at as fire_date
    FROM
        drivers d
    WHERE d.inner_status = 'FIRED_OUT' AND d.auto_park_id = ANY($1)
    ORDER BY
        d.id DESC
)
   ,handled_cash_block_rules AS (
    SELECT
        dcbr.driver_id AS driver_id,
        (SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE') AS is_balance_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE') AS balance_activation_value,
        (SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT')AS is_deposit_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT') AS deposit_activation_value
    FROM driver_cash_block_rules dcbr
    WHERE dcbr.is_enabled = true and dcbr.auto_park_id = any($1)

)
SELECT
    fd.id as driver_id,
    fd.full_name,
    fd.auto_park_id,
    cs.balance AS current_week_balance,
    cs.total_deposit AS current_week_total_deposit,
    cs.total_debt AS current_week_total_debt,
    (fd.fire_date::date)::TEXT AS fire_date,
        hcbr.is_balance_enabled,
    hcbr.balance_activation_value,
    hcbr.is_deposit_enabled ,
    hcbr.deposit_activation_value
FROM fired_drivers fd
         JOIN calculated_statements cs on cs.year = EXTRACT(YEAR FROM current_date) AND cs.week = EXTRACT(week FROM current_date)
    AND cs.driver_id = fd.id
         LEFT JOIN handled_cash_block_rules hcbr on fd.id=hcbr.driver_id
WHERE (cs.balance+cs.total_deposit)<0;