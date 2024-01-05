WITH
  sid_list AS (
    SELECT
      ct.id,
      ct.auto_park_id,
      ct.created_at,
      ct.purpose,
      ct."comment",
      CASE
        WHEN ct."comment" LIKE '%SID\_%' THEN SUBSTRING(
          ct."comment"
          FROM
            'SID\_\w{0,3}\d{2}-\d{2}-\d{4}-\d+'
        )
        ELSE NULL
      END AS sid_lable
    FROM
      cashbox_transactions ct
    WHERE
      ct.auto_park_id NOT IN ('499e334b-8916-42ab-b41a-0f0b979d6f69')
      AND ct.company_id IN (
        '4ea03592-9278-4ede-adf8-f7345a856893',
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4'
      )
      AND ct.purpose IN (
        'SPARE_PARTS_BY_ROAD_ACCIDENT',
        'CAR_VEHICLE_MAINTENANCE',
        'REPAIR_WORK',
        'TIRE_FITTING',
        'TIRE_CHANGE',
        'ROAD_ACCIDENT_ADMIN_SERVICES',
        'ROAD_ACCIDENT_WORKS',
        'DIAGNOSTICS',
        'CAR_WASH'
      )
  )
SELECT
  *
FROM
  sid_list sl
WHERE
  sl.sid_lable IS NOT NULL and sl.created_at > $1
ORDER BY
  sl.created_at DESC
