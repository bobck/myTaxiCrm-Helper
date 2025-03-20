WITH handled_cash_block_rules AS (
    SELECT
        dcbr.driver_id AS driver_id,
        COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE'), false) AS is_balance_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE') AS balance_activation_value,
        COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT'), false) AS is_deposit_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT') AS deposit_activation_value
    FROM driver_cash_block_rules dcbr
    WHERE (SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE')  = true
       OR (SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT') = true
)
SELECT
    DISTINCT ON
    (d.id)
    d.id as driver_id,
    cs.balance AS current_week_balance,
    cs.total_deposit AS current_week_total_deposit,
    cs.total_debt AS current_week_total_debt,
    hcbr.is_balance_enabled,
    hcbr.balance_activation_value,
    hcbr.is_deposit_enabled ,
    hcbr.deposit_activation_value
FROM drivers d
    JOIN calculated_statements cs on cs.year = EXTRACT(YEAR FROM current_date) AND cs.week = EXTRACT(week FROM current_date)
    AND cs.driver_id = d.id
    LEFT JOIN handled_cash_block_rules hcbr on d.id=hcbr.driver_id
WHERE d.id = ANY($1)