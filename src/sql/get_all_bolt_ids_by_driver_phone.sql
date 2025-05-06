SELECT d.id as driver_id,dti.external_id, d.full_name, d.phone ,auto_park_id
FROM drivers_to_integrations dti 
join drivers d on d.id=dti.driver_id 
where dti.integration_type='BOLT' 
and d.phone like $1
order by dti.external_id desc