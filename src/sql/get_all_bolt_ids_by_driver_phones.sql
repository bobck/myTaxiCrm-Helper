SELECT d.id as driver_id, dti.external_id, d.full_name, d.phone, auto_park_id
    FROM drivers_to_integrations dti
    JOIN drivers d ON d.id = dti.driver_id
WHERE dti.integration_type = 'BOLT'
    AND d.phone LIKE ANY ($1)
ORDER BY dti.external_id DESC;