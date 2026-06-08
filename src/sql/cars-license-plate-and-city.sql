SELECT DISTINCT ON (c.id)
  c.id,
  c.license_plate,
  ap.id AS auto_park_id,
  ap.name AS city
FROM cars c
JOIN cars_to_auto_parks ctap ON ctap.car_id = c.id AND ctap.active_in_park = TRUE
JOIN auto_parks ap ON ap.id = ctap.auto_park_id
WHERE c.id = ANY($1)
  AND ap.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
ORDER BY c.id, ap.updated_at DESC;
