WITH handled_cash_block_rules AS (
    SELECT
        dcbr.driver_id,
        COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE'), false) AS is_balance_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE') AS balance_activation_value,
        COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT'), false) AS is_deposit_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT') AS deposit_activation_value
    FROM driver_cash_block_rules dcbr
    WHERE dcbr.driver_id = ANY($1)
        )
SELECT
    cs.driver_id,
    cs.balance AS current_week_balance,
    cs.total_deposit AS current_week_total_deposit,
    cs.total_debt AS current_week_total_debt,
    hcbr.is_balance_enabled,
    hcbr.balance_activation_value,
    hcbr.is_deposit_enabled ,
    hcbr.deposit_activation_value
FROM calculated_statements cs
         LEFT JOIN handled_cash_block_rules hcbr on cs.id=hcbr.driver_id
WHERE cs.driver_id = ANY($1) AND cs.year = EXTRACT(YEAR FROM current_date) AND cs.week = EXTRACT(week FROM current_date)
