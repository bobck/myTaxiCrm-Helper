SELECT DISTINCT ON (s.car_id)
  s.car_id      AS id,
  s.event_type  AS status,
  c.license_plate
FROM schedule s
JOIN cars c ON c.id = s.car_id
WHERE s.is_latest_version = TRUE
  AND s.is_deleted = FALSE
  AND s.event_period_start < now()
  AND s.event_period_end   > now()
ORDER BY s.car_id, s.created_at DESC;
