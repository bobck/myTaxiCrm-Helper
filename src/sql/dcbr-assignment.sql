SELECT
    id,
    driver_id
FROM
    driver_cash_block_rules
WHERE
    driver_id = ANY($1)