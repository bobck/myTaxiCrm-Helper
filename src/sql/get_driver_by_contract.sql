SELECT
  d.auto_park_id,
  d.id,
  d.first_name,
  d.last_name,
  d.driver_license_number
FROM
  drivers d
WHERE
  d.contract_number = $1