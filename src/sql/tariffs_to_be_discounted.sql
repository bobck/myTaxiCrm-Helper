WITH
  last_tariff_create_time AS (
    SELECT
      auto_park_id,
      MAX(created_at) AS last_created_at
    FROM
      tariffs t
    WHERE
      t.is_enabled = TRUE
      AND t.type = 'AUTO_PARK'
      AND t.company_id = $1
    GROUP BY
      auto_park_id
  )
SELECT
--   t.id,
  t.auto_park_id,
--   t.company_id,
  t."name",
--   t.is_enabled,
--   t.created_at,
--   t.updated_at,
--   t.apply_from_week,
--   t.apply_from_year,
  t.tax_percent,
  t.tax_type,
  t.accounting,
--   t.driver_id,
--   t."type",
  t.target_marker,
--   tr.tariff_id AS tariff_rules_id,
--   tr.is_rate_in_percent,
  tr."from",
  tr.to,
  tr.rate,
  ltct.last_created_at
FROM
  tariffs t
  LEFT JOIN tariff_rules tr ON tr.tariff_id = t.id
  LEFT JOIN last_tariff_create_time ltct ON ltct.auto_park_id = t.auto_park_id
  AND ltct.last_created_at = t.created_at
WHERE
  t.is_enabled = TRUE
  AND t.type = 'AUTO_PARK'
  AND ltct.last_created_at IS NOT NULL
    AND t.auto_park_id IN (
    '2bfb0c23-33d8-4bc3-ab03-442d6ba13712',
    '2964e082-0e86-4695-b5f5-98915d190518',
    'c6dc6608-1cb3-488d-97f6-3f1132732bb9',
    '472c4d3e-3fe7-45ea-9c94-a77f364bbd86',
    '65844e7d-5e8a-4582-9ac3-c8cdaa988726',
    '5571b3ea-1ccf-4f41-bbe0-0f12ee8dfb17',
    'e4df553f-4ec2-43a8-b012-4795259e983a',
    'a7bb17b7-fc87-4617-a915-d2f9ec83cfa0',
    '34a2020d-d412-461c-ba0a-86e45f9afc78',
    'b0328dc5-71be-485d-b6ec-786d9ce52112',
    '9c8bae55-2aa2-4b25-a1e0-c93ab4bbb3ad',
    'd78cf363-5b82-41b2-8a53-79bb74969ba7',
    '052da49c-2175-4033-8010-c8e1f9a755ab'
  )
  AND t.company_id = $1