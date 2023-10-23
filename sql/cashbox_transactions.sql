WITH
  full_table AS (
    SELECT
      ct.transaction_date AS transaction_date,
      u.email AS email,
      cs.name AS name,
      ct.contractor_id AS contractor,
      ct.comment AS comment,
      co.name AS contractors,
      d.full_name AS full_name,
      c.license_plate AS license_plate,
      ct.sum AS SUM,
      ct.type AS type,
      ct.purpose AS purpose,
      ct.week AS WEEK,
      ap.name AS city,
      com.name AS company
    FROM
      cashbox_transactions ct
      LEFT JOIN contractors co ON co.id = ct.contractor_id
      LEFT JOIN cars c ON c.id = ct.car_id
      LEFT JOIN users u ON u.id = ct.added_by_user_id
      LEFT JOIN contractors cs ON cs.id = ct.contractor_id
      LEFT JOIN drivers d ON d.id = ct.driver_id
      LEFT JOIN auto_parks ap ON ap.id = ct.auto_park_id
      LEFT JOIN companies com ON com.id = ct.company_id
  )
SELECT
  transaction_date,
  email,
  name,
  contractors,
  comment,
  full_name,
  license_plate,
  SUM,
  type,
  purpose,
  '',
  WEEK,
  city,
  company
FROM
  full_table
WHERE
  transaction_date >= $1
  AND transaction_date <= $2
  AND NOT city LIKE 'Варшава'
  AND NOT city LIKE '%ФОП%'
ORDER BY
  transaction_date
