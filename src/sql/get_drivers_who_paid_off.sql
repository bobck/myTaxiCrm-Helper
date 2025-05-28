with working_drivers as (SELECT d.id as driver_id,d.auto_park_id from drivers d where d.id = ANY($1)),
drivers_total_balances as(
	select wd.driver_id,wd.auto_park_id, (cs.balance+cs.total_deposit-cs.total_debt)as driver_balance from working_drivers wd
	join calculated_statements cs on wd.driver_id=cs.driver_id
	and cs.week =$2 and cs.year=$3
)
select * from drivers_total_balances dtbc where driver_balance>=0
order by driver_id