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
    AND t.auto_park_id = ANY($3)
  AND t.company_id = $1