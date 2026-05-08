SELECT DISTINCT ON (c.id)
  c.id,
  c.license_plate,
  ap.name AS city
FROM cars c
JOIN cars_to_auto_parks ctap ON ctap.car_id = c.id AND ctap.active_in_park = TRUE
JOIN auto_parks ap ON ap.id = ctap.auto_park_id
WHERE c.id = ANY($1)
ORDER BY c.id, ap.updated_at DESC;
