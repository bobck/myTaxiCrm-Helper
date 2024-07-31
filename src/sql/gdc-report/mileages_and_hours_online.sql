WITH hours_online AS (SELECT 
			drc.auto_park_id, 
			drc.driver_id,
			drc.time_online
			FROM driver_report_cards drc 
			WHERE company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
			AND time_online > 0
			AND (EXTRACT(week FROM drc.period_from AT TIME ZONE 'europe/kyiv') >= $1 AND EXTRACT(year FROM drc.period_from AT TIME ZONE 'europe/kyiv') = $2)
			AND (EXTRACT(week FROM drc.period_to AT TIME ZONE 'europe/kyiv') <= $1 AND EXTRACT(year FROM drc.period_to AT TIME ZONE 'europe/kyiv') = $2)
			), 
			hours_online_group AS (
			SELECT 
				ho.auto_park_id, 
				(sum(ho.time_online)/60)/60 AS hours_online 
			FROM hours_online ho
			GROUP BY ho.auto_park_id
			),
			mileage_on_trips AS (SELECT 
				cr.auto_park_id,
				sum(mileage)/1000 AS mileage
			FROM car_routes cr 
			WHERE cr.company_id = '4ea03592-9278-4ede-adf8-f7345a856893' 
			AND trip_id IS NOT NULL
			AND (EXTRACT(week FROM cr.period_from AT TIME ZONE 'europe/kyiv') >= $1 AND EXTRACT(year FROM cr.period_from AT TIME ZONE 'europe/kyiv') = $2)
			AND (EXTRACT(week FROM cr.period_to AT TIME ZONE 'europe/kyiv') <= $1 AND EXTRACT(year FROM cr.period_to AT TIME ZONE 'europe/kyiv') = $2) 
			GROUP BY cr.auto_park_id),
			odometr_end_value AS (
			SELECT DISTINCT ON (coh.car_id)
				coh.car_id,
				coh.auto_park_id,
				coh.end_value
			FROM car_odometer_history coh 
			WHERE company_id = '4ea03592-9278-4ede-adf8-f7345a856893'
			AND (EXTRACT(week FROM coh.period_from AT TIME ZONE 'europe/kyiv') >= $1 AND EXTRACT(year FROM coh.period_from AT TIME ZONE 'europe/kyiv') = $2)
			AND (EXTRACT(week FROM coh.period_to AT TIME ZONE 'europe/kyiv') <= $1 AND EXTRACT(year FROM coh.period_to AT TIME ZONE 'europe/kyiv') = $2)
			ORDER BY coh.car_id, coh.period_to DESC),
			mileage_total AS (SELECT 
			coh.auto_park_id,
			sum(coh.end_value-coh.start_value)/1000 AS mileage
		FROM car_odometer_history coh
		WHERE coh.company_id = '4ea03592-9278-4ede-adf8-f7345a856893' 
		AND (EXTRACT(week FROM coh.period_from AT TIME ZONE 'europe/kyiv') >= $1 AND EXTRACT(year FROM coh.period_from AT TIME ZONE 'europe/kyiv') = $2)
		AND (EXTRACT(week FROM coh.period_to AT TIME ZONE 'europe/kyiv') <= $1 AND EXTRACT(year FROM coh.period_to AT TIME ZONE 'europe/kyiv') = $2)
		GROUP BY coh.auto_park_id)
			SELECT 
					oev.auto_park_id,
					round(avg(oev.end_value)/1000,0) AS avg_odometr_end_value,
					mt.mileage AS mileage_total,
					mot.mileage AS mileage_on_trip,
					hog.hours_online
				FROM odometr_end_value oev
				LEFT JOIN mileage_total mt ON mt.auto_park_id = oev.auto_park_id
				LEFT JOIN mileage_on_trips mot ON mot.auto_park_id = oev.auto_park_id
				LEFT JOIN hours_online_group hog ON hog.auto_park_id = oev.auto_park_id
				GROUP BY oev.auto_park_id,mt.mileage,mot.mileage,hog.hours_online