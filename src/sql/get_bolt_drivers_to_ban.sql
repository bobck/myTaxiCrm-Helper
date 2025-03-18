with aggregated_reports as (
    SELECT drc.driver_id,
           MAX(dti.external_id) AS bolt_id
    FROM driver_report_cards drc
             JOIN drivers d
                  ON drc.driver_id = d.id
             JOIN drivers_to_integrations dti
                  ON d.id = dti.driver_id
                      AND dti.integration_type = 'BOLT'
                      AND d.inner_status = 'WORKING'
             JOIN auto_parks AS ap
                  ON d.auto_park_id = ap.id
                      AND ap.country_code = 'UA'
    WHERE drc.period_from >= $1
    GROUP BY drc.driver_id
    HAVING SUM(drc.total_trips) = 0
       and count(*)>=7
)
select  d.id AS driver_id,
        d.auto_park_id AS auto_park_id,
        d.full_name,
        ar.bolt_id,
        (COALESCE(cs.total_payable_to_driver, 0) - COALESCE(cs.total_debt, 0)) AS driver_balance
FROM aggregated_reports ar
         join drivers d on ar.driver_id=d.id
         join calculated_statements cs on cs.driver_id=ar.driver_id
    AND cs.week= $2 AND cs.year= $3
	
	
	
	
	