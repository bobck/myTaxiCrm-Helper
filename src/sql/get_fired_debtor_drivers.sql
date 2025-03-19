WITH fired_drivers AS (
    SELECT
        DISTINCT ON
        (d.id)
        d.id,
        d.auto_park_id,
        d.full_name,
        dl.created_at AS fire_date
    FROM
        drivers d LEFT JOIN drivers_logs dl ON dl.driver_id = d.id
    WHERE d.inner_status = 'FIRED_OUT' AND d.company_id='4ea03592-9278-4ede-adf8-f7345a856893'
    ORDER BY
        d.id DESC
),
     calculated_statements_per_c AS (
         SELECT
             cs.driver_id ,
             cs.balance,
             cs.total_deposit,
             cs.total_debt ,
             cs.week ,
             cs."year"
         FROM
             calculated_statements cs
         WHERE
             cs.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
     )
        ,handled_cash_block_rules AS (
    SELECT
        fd.id AS driver_id,
        COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE'), false) AS is_balance_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE') AS balance_activation_value,
        COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT'), false) AS is_deposit_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT') AS deposit_activation_value
    FROM driver_cash_block_rules dcbr
        RIGHT JOIN fired_drivers fd ON dcbr.driver_id = fd.id
    WHERE COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE'), false)  = true
       OR COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT'), false) = true
)
SELECT
    fd.id as driver_id,
    fd.full_name,
    fd.auto_park_id,
    cs_current_week.week AS cs_current_week,
    cs_current_week.year AS cs_current_year,
    cs_current_week.balance AS current_week_balance,
    cs_current_week.total_deposit AS current_week_total_deposit,
    cs_current_week.total_debt AS current_week_total_debt,
    (fd.fire_date::date)::TEXT AS fire_date,
    hcbr.is_balance_enabled,
    hcbr.balance_activation_value,
    hcbr.is_deposit_enabled ,
    hcbr.deposit_activation_value
FROM fired_drivers fd
         JOIN calculated_statements_per_c cs_current_week ON
    cs_current_week.year = EXTRACT(YEAR FROM current_date)
        AND cs_current_week.week = EXTRACT(week FROM current_date)
        AND cs_current_week.driver_id = fd.id
         LEFT JOIN handled_cash_block_rules hcbr on fd.id=hcbr.driver_id
WHERE (cs_current_week.balance+cs_current_week.total_deposit)<0;