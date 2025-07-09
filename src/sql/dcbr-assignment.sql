SELECT
    id,
    auto_park_id,
    company_id,
    driver_id,
    created_at,
    updated_at,
    is_enabled,
    rules,
    mode
FROM
    driver_cash_block_rules
WHERE
    driver_id = ANY($1)

-- SELECT
--     id,
--     auto_park_id,
--     company_id,
--     driver_id,
--     created_at,
--     updated_at,
--     is_enabled,
--     rules,
--     mode
-- FROM
--     driver_cash_block_rules
-- WHERE
--     is_enabled = TRUE -- Assuming 'is_enabled' or 'is_active' is the column for active status
--     AND mode = 'MIN_DEBT'
--     AND EXISTS (
--         SELECT 1
--         FROM jsonb_array_elements(rules) AS rule_item
--         WHERE
--             rule_item->>'target' = 'BALANCE'
--             AND (rule_item->>'isEnabled')::boolean = TRUE
--             AND (rule_item->>'activationValue')::int IN (200, 1000)
--     );
