with working_drivers as (
	SELECT d.id as driver_id,d.auto_park_id from drivers d 
		WHERE d.inner_status = 'WORKING'
		AND d.company_id ='4ea03592-9278-4ede-adf8-f7345a856893' 
		AND d.auto_park_id!='e4df553f-4ec2-43a8-b012-4795259e983a'
		AND d.id != ALL($1) 
		AND d.id != ALL($5)
		AND d.auto_park_id != ALL($6)),
drivers_to_block_cash as(
	select wd.driver_id,wd.auto_park_id, (cs.balance+cs.total_deposit-cs.total_debt)as driver_balance from working_drivers wd
	join calculated_statements cs on wd.driver_id=cs.driver_id
	and cs.week =$2 and cs.year=$3
)
select * from drivers_to_block_cash dtbc where driver_balance<$4
order by driver_id