SELECT DISTINCT ON (s.car_id)
  s.car_id      AS id,
  s.event_type  AS status,
  c.license_plate,
  ap.id         AS auto_park_id
FROM schedule s
JOIN cars c ON c.id = s.car_id
JOIN cars_to_auto_parks ctap ON ctap.car_id = c.id AND ctap.active_in_park = TRUE
JOIN auto_parks ap ON ap.id = ctap.auto_park_id
WHERE s.is_latest_version = TRUE
  AND s.is_deleted = FALSE
  AND s.event_period_start < now()
  AND s.event_period_end   > now()
  AND s.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
ORDER BY s.car_id, s.created_at DESC;
