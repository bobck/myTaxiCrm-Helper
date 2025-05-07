select 
	ap.name as autopark_name,
	c.license_plate ,
	c.issue_year ,
	cm.full_name,
	s.event_type
from
	cars c
	LEFT JOIN cars_to_auto_parks ctap on ctap.active_in_park = TRUE AND ctap.car_id = c.id
left join auto_parks ap on
	(
ap.id = ctap.auto_park_id 
)
left join car_models cm on
	cm.id = c.model_id
	left join (
	select
	s.car_id,
	s.event_type
from
	schedule s
where
	event_period_start <= current_date
	and event_period_end >= current_date
	and is_latest_version = true
	and is_deleted = false
	) s on s.car_id = c.id
where
	ctap.auto_park_id != '499e334b-8916-42ab-b41a-0f0b979d6f69' and c.company_id in ('4ea03592-9278-4ede-adf8-f7345a856893','b52d5c3c-9a8e-4898-8101-7c65f3ee70a4')
	order by c.license_plate asc