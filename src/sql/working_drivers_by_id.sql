SELECT
	d.id
FROM
	drivers d
WHERE
	d.company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
	AND d.inner_status in ('INDEFINITE_LEAVE','WORKING')
	AND d.id = ANY($1)