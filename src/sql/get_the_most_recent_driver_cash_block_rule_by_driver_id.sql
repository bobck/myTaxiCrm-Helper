SELECT
    id
FROM
    driver_cash_block_rules
WHERE
    is_enabled = TRUE
    AND driver_id = $1  
ORDER BY
    created_at DESC
LIMIT 1;