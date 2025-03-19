WITH aggregated_reports AS (
    SELECT
        drc.driver_id
    FROM driver_report_cards drc
    WHERE drc.period_from >= $1
      AND drc.auto_park_id IN (
                               'e4df553f-4ec2-43a8-b012-4795259e983a', '052da49c-2175-4033-8010-c8e1f9a755ab',
                               '03328f6b-1336-4ee3-8407-bf5520411136', '2964e082-0e86-4695-b5f5-98915d190518',
                               'a7bb17b7-fc87-4617-a915-d2f9ec83cfa0', '2d3e566e-01a2-486f-ac7f-446d13f96f27',
                               '2bfb0c23-33d8-4bc3-ab03-442d6ba13712', 'ff2368ca-dce1-4315-af7b-9850056ab3ce',
                               'b0328dc5-71be-485d-b6ec-786d9ce52112', '4dd93df2-c172-488c-846f-d81452ddba70',
                               '472c4d3e-3fe7-45ea-9c94-a77f364bbd86', 'eef0dbe4-38f8-4299-95e2-25586bb02a38',
                               '2f4c5352-0296-4fba-859b-9f8955f3f2a0', 'c6dc6608-1cb3-488d-97f6-3f1132732bb9',
                               '34a2020d-d412-461c-ba0a-86e45f9afc78', 'd34e7c17-ccf3-49d1-875c-67e4378c4562',
                               '9c8bae55-2aa2-4b25-a1e0-c93ab4bbb3ad', '6897e6f0-b33d-405a-b110-8c623c864cfc',
                               'd78cf363-5b82-41b2-8a53-79bb74969ba7', 'ee12f8cd-570e-4eab-8ec8-1ead1c619bb7',
                               '65844e7d-5e8a-4582-9ac3-c8cdaa988726', '45dcaa21-bceb-45f2-bba9-5c72bbac441f'
        )
    GROUP BY drc.driver_id
    HAVING SUM(drc.total_trips) = 0
       AND COUNT(*) >= 7
)
SELECT DISTINCT ON (d.id)
    d.id AS driver_id,
    d.auto_park_id,
    d.full_name,
    dti.external_id AS bolt_id,
    (COALESCE(cs.total_payable_to_driver, 0) - COALESCE(cs.total_debt, 0)) AS driver_balance
FROM aggregated_reports ar
    JOIN drivers d
ON ar.driver_id = d.id
    AND d.inner_status = 'WORKING'
    JOIN calculated_statements cs
    ON cs.driver_id = ar.driver_id
    AND cs.week = $2
    AND cs.year = $3
    JOIN drivers_to_integrations dti
    ON ar.driver_id = dti.driver_id
    AND dti.integration_type = 'BOLT'
WHERE dti.external_id IS NOT NULL
ORDER BY d.id;
