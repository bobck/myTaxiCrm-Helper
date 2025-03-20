WITH fired_drivers AS (
    SELECT
        DISTINCT ON
        (d.id)
        d.id,
        d.auto_park_id,
        d.full_name,
        dl.created_at AS fire_date
    FROM
        drivers d LEFT JOIN drivers_logs dl ON dl.driver_id = d.id
    WHERE d.inner_status = 'FIRED_OUT' AND d.auto_park_id IN (
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
    ORDER BY
        d.id DESC
)
   ,handled_cash_block_rules AS (
    SELECT
        dcbr.driver_id AS driver_id,
        COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE'), false) AS is_balance_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE') AS balance_activation_value,
        COALESCE((SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT'), false) AS is_deposit_enabled,
        (SELECT (rule->>'activationValue')::numeric FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT') AS deposit_activation_value
    FROM driver_cash_block_rules dcbr
    WHERE (SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'BALANCE')  = true
       OR (SELECT (rule->>'isEnabled')::boolean FROM jsonb_array_elements(dcbr.rules) AS rule WHERE rule->>'target' = 'DEPOSIT') = true
)
SELECT
    fd.id as driver_id,
    fd.full_name,
    fd.auto_park_id,
    cs.week AS current_week,
    cs.year AS current_year,
    cs.balance AS current_week_balance,
    cs.total_deposit AS current_week_total_deposit,
    cs.total_debt AS current_week_total_debt,
    (fd.fire_date::date)::TEXT AS fire_date,
        hcbr.is_balance_enabled,
    hcbr.balance_activation_value,
    hcbr.is_deposit_enabled ,
    hcbr.deposit_activation_value
FROM fired_drivers fd
         JOIN calculated_statements cs on cs.year = EXTRACT(YEAR FROM current_date) AND cs.week = EXTRACT(week FROM current_date)
    AND cs.driver_id = fd.id
         LEFT JOIN handled_cash_block_rules hcbr on fd.id=hcbr.driver_id
WHERE (cs.balance+cs.total_deposit)<0;