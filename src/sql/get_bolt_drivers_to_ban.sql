SELECT
    d.id,
    d.full_name,
    max(dti.external_id) AS bolt_id,
    SUM(drc.total_trips)as total_trips,
    dti.integration_id,
    count(*) as report_count
FROM
    drivers d
        JOIN
    drivers_to_integrations dti
    ON d.id = dti.driver_id
        AND dti.integration_type = 'BOLT'
        AND d.inner_status = 'WORKING'
        JOIN
    driver_report_cards drc
    ON drc.driver_id = d.id
        AND drc.period_from >= NOW() - INTERVAL '8 days'
        JOIN auto_parks AS ap
             ON d.auto_park_id = ap.id
                 AND ap.country_code = 'UA'

GROUP BY
    d.id, d.full_name,dti.integration_id
HAVING SUM(drc.total_trips)=0
   AND count(*)>=7


-- SELECT
--     d.id,
--     d.full_name,
--     max(dti.external_id) AS bolt_id,
--     SUM(drc.total_trips)as total_trips,
--     dti.integration_id,
--     count(*) as report_count,
--     ct.driver_balance as driver_balance
-- FROM
--     drivers d
--         JOIN
--     drivers_to_integrations dti
--     ON d.id = dti.driver_id
--         AND dti.integration_type = 'BOLT'
--         AND d.inner_status = 'WORKING'
--         JOIN
--     driver_report_cards drc
--     ON drc.driver_id = d.id
--         AND drc.period_from >= NOW() - INTERVAL '8 days'
--     JOIN auto_parks AS ap
-- ON d.auto_park_id = ap.id
--     AND ap.country_code = 'UA'
--     join cashbox_transactions ct
--     on ct.driver_id=d.id
-- GROUP BY
--     d.id, d.full_name, dti.integration_id, ct.driver_balance
-- HAVING SUM(drc.total_trips)=0
--    AND count(*)>=7
--
-- NOW() - INTERVAL '8 days' 8 days are required because reports of the day when the query are called are absent in myTaxi till the end of the day
