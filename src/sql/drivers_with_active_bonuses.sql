SELECT
	driver_id,
	id
FROM
	driver_bonus_rules dbr
WHERE
	dbr.is_enabled = TRUE
	AND driver_id = ANY($1)