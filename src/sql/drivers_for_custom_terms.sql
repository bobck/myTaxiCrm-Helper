SELECT
  d.id,
  d.company_id,
  d.auto_park_id,
  d.full_name,
  d.inner_status,
  d.created_at,
  t.is_enabled
FROM
  drivers d
  LEFT JOIN (
    SELECT DISTINCT
      ON (driver_id) t.driver_id,
      t.is_enabled,
      t.created_at
    FROM
      tariffs t
    WHERE
      type = 'DRIVER_CUSTOM'
    ORDER BY
      driver_id,
      created_at DESC
  ) t ON t.driver_id = d.id
WHERE
  d.created_at BETWEEN TO_TIMESTAMP ($1 || ' 00:00', 'YYYY-MM-DD HH24:MI')
  AND TO_TIMESTAMP ($1 || ' 23:59', 'YYYY-MM-DD HH24:MI')
  AND d.inner_status = 'WORKING'
	AND (t.is_enabled = 'false' or t.is_enabled is null )
  AND d.auto_park_id IN (
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
  AND d.company_id = $2
