SELECT
    cs.driver_id,
    cs.balance AS current_week_balance,
    cs.total_deposit AS current_week_total_deposit,
    cs.total_debt AS current_week_total_debt
FROM calculated_statements cs
WHERE cs.year = EXTRACT(YEAR FROM current_date)
  AND cs.week = EXTRACT(week FROM current_date)
  AND cs.driver_id =ANY($1)
ORDER BY cs.driver_id ASC;

