SELECT
    d.id AS driver_id,
    d.auto_park_id AS auto_park_id,
    d.full_name,
    MAX(dti.external_id) AS bolt_id,
    SUM(drc.total_trips) AS total_trips,
    COUNT(*) AS report_count,
    (COALESCE(cs.total_payable_to_driver, 0) - COALESCE(cs.total_debt, 0)) AS driver_balance
FROM drivers d
    JOIN drivers_to_integrations dti
        ON d.id = dti.driver_id
        AND dti.integration_type = 'BOLT'
        AND d.inner_status = 'WORKING'
    JOIN driver_report_cards drc
        ON drc.driver_id = d.id
        AND drc.period_from >= $1
    JOIN auto_parks AS ap
        ON d.auto_park_id = ap.id
        AND ap.country_code = 'UA'
    JOIN calculated_statements cs
        ON cs.driver_id= d.id
        AND cs.week= $2
        AND cs.year= $3
WHERE d.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
GROUP BY
    d.id, d.full_name,dti.integration_id, d.auto_park_id,(COALESCE(cs.total_payable_to_driver, 0) - COALESCE(cs.total_debt, 0))
HAVING SUM(drc.total_trips)=0
   AND count(*)>=7

-- NOW() - INTERVAL '8 days' 8 days are required because reports of the day when the query are called are absent in myTaxi till the end of the day
