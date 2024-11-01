SELECT
	d.auto_park_id ,
	d.id,
	d.first_name ,
	d.last_name ,
	d.phone ,
	d.created_at
FROM
	drivers d
WHERE
	d.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
	AND d.inner_status = 'WORKING'
	AND ((d.created_at AT TIME ZONE 'europe/kyiv')::date) = $1