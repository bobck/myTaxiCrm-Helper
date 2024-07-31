export const fuelReportTableSchema = [
    { name: 'auto_park_name', type: 'STRING', mode: 'REQUIRED' },
    { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'driver_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'full_name', type: 'STRING', mode: 'REQUIRED' },
    { name: 'car_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'mapon_id', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'license_plate', type: 'STRING', mode: 'REQUIRED' },
    { name: 'wog_card', type: 'STRING', mode: 'REQUIRED' },
    { name: 'total_income', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'total_trips', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'mapon_mileage', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'mileage_no_trips', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'event_types', type: 'JSON', mode: 'NULLABLE' },
    { name: 'date', type: 'DATE', mode: 'REQUIRED' },
    { name: 'schedule_event_period_start', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'schedule_event_period_end', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'driver_report_card_period_from', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'driver_report_card_period_to', type: 'TIMESTAMP', mode: 'REQUIRED' },
];


export const fleetsIncomAndExpensesReportTableSchema = [
    { name: 'company_name', type: 'STRING', mode: 'REQUIRED' },
    { name: 'auto_park_name', type: 'STRING', mode: 'REQUIRED' },
    { name: 'week', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'year', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'flow', type: 'STRING', mode: 'REQUIRED' },
    { name: 'type', type: 'STRING', mode: 'REQUIRED' },
    { name: 'purpose', type: 'STRING', mode: 'NULLABLE' },
    { name: 'expense_type', type: 'STRING', mode: 'NULLABLE' },
    { name: 'sum', type: 'FLOAT', mode: 'REQUIRED' }
];

export const leadsTableSchema = [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'source_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'is_duplicate', type: 'BOOLEAN', mode: 'REQUIRED' },
    { name: 'city_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'date', type: 'DATE', mode: 'REQUIRED' }
];

export const dealsHrInterviewTableSchema = [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'source_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'city_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'stage_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'is_rescheduled', type: 'BOOLEAN', mode: 'REQUIRED' },
    { name: 'date', type: 'DATE', mode: 'REQUIRED' }
];

export const dealsHrClosedTableSchema = [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'source_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'city_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'stage_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'date', type: 'DATE', mode: 'REQUIRED' }
]

export const dealsHrRescheduledTableSchema = [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'source_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'city_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'year', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'week', type: 'INTEGER', mode: 'REQUIRED' }
]

export const workingDriversTableSchema = [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'start_working_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'temporary_leave_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'fired_out_time', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'type', type: 'STRING', mode: 'REQUIRED' },
    { name: 'date', type: 'DATE', mode: 'REQUIRED' }
]

export const uniqWorkedDriversAndAvgLifeTimeTableSchema = [
    { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'driver_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'driver_created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'rides_count', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'fired_status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'life_days', type: 'FLOAT', mode: 'REQUIRED' },
    { name: 'year', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'week', type: 'INTEGER', mode: 'REQUIRED' }
]

export const temporaryLeaveByDriversEditingHistoryTableSchema = [
    { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'driver_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'returned_status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'date', type: 'DATE', mode: 'REQUIRED' }
]

export const mileagesAndHoursOnlineTableSchema = [
    { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'avg_odometr_end_value', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'mileage_total', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'mileage_on_trip', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'hours_online', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'year', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'week', type: 'INTEGER', mode: 'REQUIRED' }
]

export const firedByDriversLogsTableSchema = [
    { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'driver_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'event_time', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'is_restored', type: 'STRING', mode: 'NULLABLE' },
    { name: 'date', type: 'DATE', mode: 'REQUIRED' }
]

export const carUsageReportTableSchema = [
    { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'with_driver', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'total_cars', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'aviable_cars', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'total_trips', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'date', type: 'DATE', mode: 'REQUIRED' }
] 

