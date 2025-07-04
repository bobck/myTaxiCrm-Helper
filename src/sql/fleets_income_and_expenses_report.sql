WITH
  _cashbox_transactions AS (
    SELECT
      ct.company_id,
      COALESCE(ct.shared_auto_park_id,ct.auto_park_id) as auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type,
      SUM
    FROM
      cashbox_transactions ct
    WHERE
      ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
      AND ct.auto_park_id NOT IN (
        'de4bf8ba-30c2-452c-a688-104063052961',
        '58ea1e9e-ebdd-4c4d-870c-6ef06e868c60',
        'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b',
        '499e334b-8916-42ab-b41a-0f0b979d6f69'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
  ),
  income AS (
    SELECT
      cs.company_id,
      cs.auto_park_id,
      cs.week,
      cs.year,
      'Дохід' AS flow,
      'Борг поточного рахунку' AS type,
      '' AS purpose,
      '' AS expense_type,
      CASE
        WHEN (
          cs.total_payable_to_driver < 0
          AND cs.last_week_balance < 0
        ) THEN (cs.total_payable_to_driver - cs.last_week_balance)
        WHEN (
          cs.total_payable_to_driver < 0
          AND cs.last_week_balance >= 0
        ) THEN cs.total_payable_to_driver
        WHEN (
          cs.total_payable_to_driver >= 0
          AND cs.last_week_balance >= 0
        ) THEN 0
        WHEN (
          cs.total_payable_to_driver >= 0
          AND cs.last_week_balance < 0
        ) THEN (cs.last_week_balance * -1)
        ELSE 0
      END AS SUM
    FROM
      calculated_statements cs
    WHERE
      (
        cs.driver_revenue != 0
        OR cs.accounting != 0
        OR cs.tariff_tax != 0
        OR cs.total_bonuses != 0
        OR cs.total_rate_revenue::NUMERIC != 0 
        OR cs.total_payable_to_driver < 0
        OR cs.last_week_balance < 0
      )
      AND (cs.YEAR > $1 OR (cs.YEAR = $1 AND cs.week >= $2))
      AND cs.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    UNION ALL
    SELECT
      cs.company_id,
      cs.auto_park_id,
      cs.week,
      cs.year,
      'Дохід' AS flow,
      'Дохід від поїздок' AS type,
      'PROFIT_FROM_TRIPS' AS purpose,
      UNNEST (
        ARRAY[
          'driver_revenue',
          'accounting',
          'tariff_tax',
          'total_rate_revenue_without_initial_details',
          'total_bonuses'
        ]
      ) AS expense_type,
      UNNEST (
        ARRAY[
          cs.driver_revenue,
          cs.accounting,
          cs.tariff_tax,
          (cs.total_rate_revenue + cs.tariff_tax - cs.accounting::numeric - cs.total_bonuses::numeric ) * -1,
          cs.total_bonuses * -1
        ]
      ) AS SUM
    FROM
      calculated_statements cs
    WHERE
      (
        cs.driver_revenue != 0
        OR cs.accounting != 0
        OR cs.tariff_tax != 0
        OR cs.total_bonuses != 0
        OR cs.total_rate_revenue::NUMERIC != 0
        OR cs.total_payable_to_driver < 0
        OR cs.last_week_balance < 0
      )
      AND (cs.YEAR > $1 OR (cs.YEAR = $1 AND cs.week >= $2))
      AND cs.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Дохід' AS flow,
      'Оренда авто' AS type,
      ct.purpose,
      ct.expense_type,
      CASE
        WHEN ct.purpose IN ('CAR_RENTAL_REFUND') THEN SUM(ct.sum) * -1
        ELSE SUM(ct.sum)
      END AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.purpose IN (
        'CAR_RENTAL',
        'CAR_RENTAL_REFUND',
        'CAR_RENTAL_OVERRUN_PAYMENT'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Дохід' AS flow,
      'Погашення боргу' AS type,
      ct.purpose,
      ct.expense_type,
      SUM(ct.sum) AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.purpose IN (
        'VOLUNTARY_PAY_OFF_DEBT',
        'PAY_OFF_DEBT_DEPOSIT_ACCOUNT',
        'FORCED_PAY_OFF_DEBT',
        'TOP_UP_CASHBOX_ROAD_ACCIDENT_COMPENSATION'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Дохід' AS flow,
      'Штрафи' AS type,
      ct.purpose,
      ct.expense_type,
      SUM(ct.sum) AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.purpose IN (
        'FINES_OVERSPEED',
        'FINES_TRAFFICRULES',
        'FINES_FIRED_OUT_DEDUCT',
        'FINES_OTHER',
        'FINES_DOWNTIME',
        'FINES_OVERRUN',
        'FINES_LOW_EFFICIENCY'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Дохід' AS flow,
      'Здача вторсировини' AS type,
      ct.purpose,
      ct.expense_type,
      SUM(ct.sum) AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.purpose IN ('TOP_UP_CASHBOX_RECYCLING')
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Дохід' AS flow,
      'Компенсації' AS type,
      ct.purpose,
      ct.expense_type,
      SUM(ct.sum) * -1 AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.purpose IN ('COMPENSATION')
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Витрата' AS flow,
      'Ремонт та обслуговування авто' AS type,
      ct.purpose,
      ct.expense_type,
      CASE
        WHEN ct.purpose IN ('AUTO_PARK_EXPENSE', 'BUSINESS_EXPENSE_AUTO_PARK') THEN SUM(ct.sum) * -1
        ELSE SUM(ct.sum)
      END AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.expense_type IN (
        'PURCHASE_SUPPLIES',
        'CAR_ACCESSORY',
        'DIAGNOSTICS',
        'ROAD_ACCIDENT_WORKS',
        'ROAD_ACCIDENT_ADMIN_SERVICES',
        'MAINTENANCE_STATION_SERVICES',
        'MAINTENANCE_STATION_SUPPLIES',
        'TIRE_BYING',
        'TIRE_FITTING',
        'REPAIR_WORK',
        'CAR_VEHICLE_MAINTENANCE',
        'SPARE_PARTS_BY_ROAD_ACCIDENT',
        'SPARE_PARTS_BY_WAREHOUSE',
        'SPARE_PARTS_BY_URGENT_REPAIR',
        'SPARE_PARTS_BY_REGULATIONS',
        'CAR_WASH',
        'FRANCHISE'
      )
      AND ct.purpose NOT IN (
        'AUTO_PARK_EXPENSE_PAID_BY_DRIVER',
        'COMPENSATION'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Витрата' AS flow,
      'Офісні витрати' AS type,
      ct.purpose,
      ct.expense_type,
      CASE
        WHEN ct.purpose IN ('AUTO_PARK_EXPENSE', 'BUSINESS_EXPENSE_AUTO_PARK') THEN SUM(ct.sum) * -1
        ELSE SUM(ct.sum)
      END AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.expense_type IN (
        'BUSINESS_TRIP_OFFICE',
        'OFFICE_TRANSPORTATION',
        'PARKING',
        'PARKING_AREA_RENT',
        'EQUIPMENT_OFFICE',
        'REPAIR_OFFICE_CENTRAL',
        'REPAIR_OFFICE',
        'CATERING_OFFICE',
        'MEDICINES',
        'DOCUMENT_FLOW',
        'HOUSEHOLD_GOODS',
        'STATIONARY',
        'UTILITY_BILLS_METERS',
        'UTILITY_BILLS',
        'ROOM_RENTAL',
        'HOSPITALITY',
        'TRAVEL_COSTS_OFFICE',
        'TRAVEL_COSTS_DRIVER',
        'TOP_UP_TELEPHONE_BALANCE',
        'TELEPHONE_SET',
        'DIESEL_FUEL',
        'GAS',
        'GASOLINE'
      )
      AND ct.purpose NOT IN (
        'AUTO_PARK_EXPENSE_PAID_BY_DRIVER',
        'COMPENSATION'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Витрата' AS flow,
      'Оплата праці' AS type,
      ct.purpose,
      ct.expense_type,
      CASE
        WHEN ct.purpose IN ('AUTO_PARK_EXPENSE', 'BUSINESS_EXPENSE_AUTO_PARK') THEN SUM(ct.sum) * -1
        ELSE SUM(ct.sum)
      END AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.expense_type IN (
        'WORK_BONUS_OFFICE',
        'WORK_BONUS_OFFICE_CENTRAL',
        'KPI_BONUSES',
        'REFERRAL_BONUSES',
        'SALARY_OR_ADVANCE_OFFICE_CENTRAL',
        'SALARY_OR_ADVANCE_OFFICE'
      )
      AND ct.purpose NOT IN (
        'AUTO_PARK_EXPENSE_PAID_BY_DRIVER',
        'COMPENSATION'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Витрата' AS flow,
      'Маркетинг' AS type,
      ct.purpose,
      ct.expense_type,
      CASE
        WHEN ct.purpose IN ('AUTO_PARK_EXPENSE', 'BUSINESS_EXPENSE_AUTO_PARK') THEN SUM(ct.sum) * -1
        ELSE SUM(ct.sum)
      END AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.expense_type IN ('ADVERTISING_OFFICE_CENTRAL', 'ADVERTISING')
      AND ct.purpose NOT IN (
        'AUTO_PARK_EXPENSE_PAID_BY_DRIVER',
        'COMPENSATION'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Витрата' AS flow,
      'Штрафи ПДР' AS type,
      ct.purpose,
      ct.expense_type,
      CASE
        WHEN ct.purpose IN ('AUTO_PARK_EXPENSE', 'BUSINESS_EXPENSE_AUTO_PARK') THEN SUM(ct.sum) * -1
        ELSE SUM(ct.sum)
      END AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.expense_type IN ('TRAFFIC_FINES')
      AND ct.purpose NOT IN (
        'AUTO_PARK_EXPENSE_PAID_BY_DRIVER',
        'COMPENSATION'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Витрата' AS flow,
      'Послуги доставки' AS type,
      ct.purpose,
      ct.expense_type,
      CASE
        WHEN ct.purpose IN ('AUTO_PARK_EXPENSE', 'BUSINESS_EXPENSE_AUTO_PARK') THEN SUM(ct.sum) * -1
        ELSE SUM(ct.sum)
      END AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.expense_type IN ('DELIVERY')
      AND ct.purpose NOT IN (
        'AUTO_PARK_EXPENSE_PAID_BY_DRIVER',
        'COMPENSATION'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Витрата' AS flow,
      'Податки' AS type,
      ct.purpose,
      ct.expense_type,
      CASE
        WHEN ct.purpose IN ('AUTO_PARK_EXPENSE', 'BUSINESS_EXPENSE_AUTO_PARK') THEN SUM(ct.sum) * -1
        ELSE SUM(ct.sum)
      END AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.expense_type IN ('TAXES')
      AND ct.purpose NOT IN (
        'AUTO_PARK_EXPENSE_PAID_BY_DRIVER',
        'COMPENSATION'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Витрата' AS flow,
      'Банківські витрати' AS type,
      ct.purpose,
      ct.expense_type,
      CASE
        WHEN ct.purpose IN ('AUTO_PARK_EXPENSE', 'BUSINESS_EXPENSE_AUTO_PARK') THEN SUM(ct.sum) * -1
        ELSE SUM(ct.sum)
      END AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.expense_type IN ('BANK_COMMISSION')
      AND ct.purpose NOT IN (
        'AUTO_PARK_EXPENSE_PAID_BY_DRIVER',
        'COMPENSATION'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
    UNION ALL
    SELECT
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      'Витрата' AS flow,
      'Інші витрати' AS type,
      ct.purpose,
      ct.expense_type,
      SUM(ct.sum) AS SUM
    FROM
      _cashbox_transactions ct
    WHERE
      ct.purpose IN (
        'TOP_UP_CASHBOX_CORRECTION',
        'TOP_UP_CASHBOX_RETURNING'
      )
      AND (ct.YEAR > $1 OR (ct.YEAR = $1 AND ct.week >= $2))
      AND ct.company_id IN (
        'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
        '4ea03592-9278-4ede-adf8-f7345a856893'
      )
    GROUP BY
      ct.company_id,
      ct.auto_park_id,
      ct.week,
      ct.year,
      ct.purpose,
      ct.expense_type
  )
SELECT
  c.name AS company_name,
  CASE
    WHEN i.auto_park_id = '65844e7d-5e8a-4582-9ac3-c8cdaa988726' THEN 'Камянець Подільськ'
    ELSE ap.name
  END AS auto_park_name,
  i.week,
  i.year,
  i.flow,
  i.type,
  i.purpose,
  i.expense_type,
  i.sum
FROM
  income i
  LEFT JOIN companies c ON c.id = i.company_id
  LEFT JOIN auto_parks ap ON ap.id = i.auto_park_id
WHERE
  c.id IN (
    'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
    '4ea03592-9278-4ede-adf8-f7345a856893'
  )
  AND ap.id NOT IN (
    'de4bf8ba-30c2-452c-a688-104063052961',
    '58ea1e9e-ebdd-4c4d-870c-6ef06e868c60',
    'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b',
    '499e334b-8916-42ab-b41a-0f0b979d6f69'
  )
  AND (i.year > $1 OR (i.year = $1 AND i.week >= $2))