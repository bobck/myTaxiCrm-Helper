select
	auto_park_id ,
	id
from
	drivers
where
	company_id in ('4ea03592-9278-4ede-adf8-f7345a856893', 'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4')
	and inner_status = 'WITHOUT_STATUS'