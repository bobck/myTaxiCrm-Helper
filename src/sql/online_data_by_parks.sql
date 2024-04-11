with online_data as (
select
	c."name" as company_name,
	odi.auto_park_id,
	ap."name" as auto_park_name,
	odi.driver_id,
	odi.created_at ,
	odi.updated_at ,
	date(odi.updated_at) as updated_date,
	i."type",
	cast(odi.online_driver_income_details[i.id::text]['totalTrips'] as INT) total_trips
from
	online_driver_incomes odi
left join integrations i on
	odi.auto_park_id = i.auto_park_id
	and i.company_id = odi.company_id
left join companies c on
	c.id = odi.company_id
left join auto_parks ap on
	ap.company_id = odi.company_id
	and ap.id = odi.auto_park_id)
	select
	*
from
	online_data
where
	total_trips is not null
	and total_trips > 0 and updated_date = current_date
	and auto_park_id = ANY($1::uuid[])