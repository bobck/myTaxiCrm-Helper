SELECT
    dcbr.driver_id AS driver_id,
    (SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE') AS is_balance_enabled,
    (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE') AS balance_activation_value,
    (SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT')AS is_deposit_enabled,
    (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT') AS deposit_activation_value
FROM driver_cash_block_rules dcbr
WHERE dcbr.is_enabled = true and dcbr.driver_id = any($1)
ORDER BY dcbr.driver_id ASC;