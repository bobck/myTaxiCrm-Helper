WITH
  autopark AS (
    SELECT
      auto_park_id AS autopark,
      company_id AS company,
      WEEK AS WEEK,
      YEAR AS YEAR,
      SUM(rides_count) AS rides,
      SUM(driver_revenue) AS total_tariff,
      SUM(total_rate_revenue) AS driver_salary,
      SUM(rent_debt) AS rent,
      SUM(total_fines) AS fines,
      SUM(compensation) AS compensation,
      SUM(pay_off_debt_current_account) AS pay_off_debt_account,
      SUM(pay_off_debt_deposit_account) AS pay_offd_ebt_deposit,
      SUM(auto_park_revenue) AS park_salary
    FROM
      calculated_statements
    WHERE
      WEEK >= $1
      AND WEEK <= $2
    GROUP BY
      WEEK,
      YEAR,
      auto_park_id,
      company_id
  ),
  city AS (
    SELECT
      id AS id,
      name AS city
    FROM
      auto_parks ap
  )
SELECT
  a.*,
  c.city,
  com.name
FROM
  autopark a
  LEFT JOIN companies com ON com.id = a.company
  JOIN city c ON a.autopark = c.id
WHERE
  NOT city LIKE '%Варшава%'
  AND NOT city LIKE '%ФОП%'
ORDER BY
  WEEK,
  city
