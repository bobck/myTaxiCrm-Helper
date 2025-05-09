SELECT
    c.license_plate,
    s.event_type
FROM
    cars c
LEFT JOIN (
    SELECT
        s_inner.car_id,
        s_inner.event_type
    FROM
        schedule s_inner
    WHERE
        s_inner.event_period_start <= CURRENT_DATE
        AND s_inner.event_period_end >= CURRENT_DATE
        AND s_inner.is_latest_version = TRUE
        AND s_inner.is_deleted = FALSE
) s ON s.car_id = c.id
WHERE
    c.company_id IN (
        '4ea03592-9278-4ede-adf8-f7345a856893',
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4'
    )
ORDER BY
    c.license_plate ASC;