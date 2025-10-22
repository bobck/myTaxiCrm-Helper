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
  {
    name: 'driver_report_card_period_from',
    type: 'TIMESTAMP',
    mode: 'REQUIRED',
  },
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
  { name: 'sum', type: 'FLOAT', mode: 'REQUIRED' },
];

export const leadsTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'source_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'is_duplicate', type: 'BOOLEAN', mode: 'REQUIRED' },
  { name: 'city_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const dealsHrInterviewTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'source_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'city_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'stage_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'is_rescheduled', type: 'BOOLEAN', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const dealsHrClosedTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'source_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'city_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'stage_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
  { name: 'is_from_fired', type: 'BOOLEAN', mode: 'REQUIRED' },
];

export const dealsHrRescheduledTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'source_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'city_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'year', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'week', type: 'INTEGER', mode: 'REQUIRED' },
];

export const workingDriversTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'start_working_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'temporary_leave_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
  { name: 'fired_out_time', type: 'TIMESTAMP', mode: 'NULLABLE' },
  { name: 'type', type: 'STRING', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const uniqWorkedDriversAndAvgLifeTimeTableSchema = [
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'driver_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'driver_created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'rides_count', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'fired_status', type: 'STRING', mode: 'NULLABLE' },
  { name: 'life_days', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'year', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'week', type: 'INTEGER', mode: 'REQUIRED' },
];

export const temporaryLeaveByDriversEditingHistoryTableSchema = [
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'driver_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'returned_status', type: 'STRING', mode: 'NULLABLE' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const mileagesAndHoursOnlineTableSchema = [
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'avg_odometr_end_value', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'mileage_total', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'mileage_on_trip', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'hours_online', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'year', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'week', type: 'INTEGER', mode: 'REQUIRED' },
];

export const firedByDriversLogsTableSchema = [
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'driver_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'event_time', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'is_restored', type: 'STRING', mode: 'NULLABLE' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
  { name: 'status', type: 'STRING', mode: 'NULLABLE' },
];

export const carUsageReportTableSchema = [
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'with_driver', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'total_cars', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'aviable_cars', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'total_trips', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'without_driver', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'road_accident', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'on_service_station', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const carsRoutsReportTableSchema = [
  { name: 'period_from', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'period_to', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'route_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'trip_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'mileage', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'mapon_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'license_plate', type: 'STRING', mode: 'REQUIRED' },
  { name: 'auto_park_name', type: 'STRING', mode: 'REQUIRED' },
  { name: 'driver_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'driver_name', type: 'STRING', mode: 'REQUIRED' },
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const polandBookkeepingReportTableSchema = [
  { name: 'license_plate', type: 'STRING', mode: 'REQUIRED' },
  { name: 'driver_name', type: 'STRING', mode: 'REQUIRED' },
  { name: 'bill_period_start', type: 'DATE', mode: 'REQUIRED' },
  { name: 'bill_period_end', type: 'DATE', mode: 'REQUIRED' },
  { name: 'bill_days', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'car_contract_start_date', type: 'DATE', mode: 'REQUIRED' },
  { name: 'auto_park_name', type: 'STRING', mode: 'REQUIRED' },
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'model_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'model_price', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'kwota', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'car_owner_name', type: 'STRING', mode: 'REQUIRED' },
  { name: 'owner_account_number', type: 'STRING', mode: 'REQUIRED' },
  { name: 'period_from', type: 'DATE', mode: 'REQUIRED' },
  { name: 'period_to', type: 'DATE', mode: 'REQUIRED' },
  { name: 'year', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'week', type: 'INTEGER', mode: 'REQUIRED' },
];

export const manifoldDealsTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'accident_id', type: 'STRING' },
  { name: 'aviable_for_office_only', type: 'BOOLEAN', mode: 'REQUIRED' },
  { name: 'contact_id', type: 'STRING' },
  { name: 'contact_phone', type: 'STRING' },
  { name: 'deal_created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'stage_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'city_name', type: 'STRING', mode: 'REQUIRED' },
  { name: 'assigned_by_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'title', type: 'STRING', mode: 'REQUIRED' },
];

export const carTransferAcceptanceListTableSchema = [
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'car_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'license_plate', type: 'STRING', mode: 'REQUIRED' },
  { name: 'type', type: 'STRING', mode: 'REQUIRED' },
  { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const carTransferAcceptanceCompanyTableSchema = [
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'cars', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const activeDriversWithScheduleCompanyTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'event_period_start', type: 'TIMESTAMP' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const activeDriversWithScheduleEventsTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'start_working_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'temporary_leave_at', type: 'TIMESTAMP' },
  { name: 'fired_out_time', type: 'TIMESTAMP' },
  { name: 'day_events', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'event_period_start', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'flow', type: 'STRING', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];

export const repairAndAccidentCarsTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'auto_park_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'license_plate', type: 'STRING', mode: 'REQUIRED' },
  { name: 'car_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'event_type', type: 'STRING', mode: 'REQUIRED' },
  { name: 'back_to_work', type: 'BOOLEAN', mode: 'REQUIRED' },
  { name: 'work_stopped', type: 'BOOLEAN', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];
export const transfersTableSchema = [
  { name: 'branch_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'warehouse_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'created_at', type: 'INT64', mode: 'REQUIRED' },
  { name: 'description', type: 'STRING', mode: 'NULLABLE' },
  { name: 'created_by_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'id_label', type: 'STRING', mode: 'REQUIRED' },
  { name: 'cost', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'source_warehouse_title', type: 'STRING', mode: 'REQUIRED' },
  { name: 'target_warehouse_title', type: 'STRING', mode: 'REQUIRED' },
  { name: 'created_by_fullname', type: 'STRING', mode: 'REQUIRED' },
];

export const transferProductsTableSchema = [
  { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'title', type: 'STRING', mode: 'REQUIRED' },
  { name: 'is_serial', type: 'BOOLEAN', mode: 'REQUIRED' },
  { name: 'code', type: 'STRING', mode: 'NULLABLE' },
  { name: 'article', type: 'STRING', mode: 'REQUIRED' },
  { name: 'amount', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'uom_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'uom_description', type: 'STRING', mode: 'REQUIRED' },
  { name: 'uom_title', type: 'STRING', mode: 'REQUIRED' },
  { name: 'transfer_id', type: 'INTEGER', mode: 'REQUIRED' },
];
export const ordersTableSchema = [
  { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'modified_at', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'uuid', type: 'STRING', mode: 'NULLABLE' },
  { name: 'created_at', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'done_at', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'scheduled_for', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'duration', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'kindof_good', type: 'STRING', mode: 'NULLABLE' },
  { name: 'serial', type: 'STRING', mode: 'NULLABLE' },
  { name: 'packagelist', type: 'STRING', mode: 'NULLABLE' },
  { name: 'appearance', type: 'STRING', mode: 'NULLABLE' },
  { name: 'malfunction', type: 'STRING', mode: 'NULLABLE' },
  { name: 'manager_notes', type: 'STRING', mode: 'NULLABLE' },
  { name: 'engineer_notes', type: 'STRING', mode: 'NULLABLE' },
  { name: 'resume', type: 'STRING', mode: 'NULLABLE' },
  { name: 'payed', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'missed_payments', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'warranty_measures', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'warranty_date', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'urgent', type: 'BOOLEAN', mode: 'NULLABLE' },
  { name: 'discount_sum', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'custom_fields', type: 'STRING', mode: 'NULLABLE' },
  { name: 'estimated_cost', type: 'STRING', mode: 'NULLABLE' },
  { name: 'closed_at', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'estimated_done_at', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'id_label', type: 'STRING', mode: 'NULLABLE' },
  { name: 'price', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'branch_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'overdue', type: 'BOOLEAN', mode: 'NULLABLE' },
  { name: 'status_overdue', type: 'BOOLEAN', mode: 'NULLABLE' },
  { name: 'manager_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'engineer_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'created_by_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'closed_by_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'brand', type: 'STRING', mode: 'NULLABLE' },
  { name: 'model', type: 'STRING', mode: 'NULLABLE' },
  { name: 'client_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'client_name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'asset_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'asset_uid', type: 'STRING', mode: 'NULLABLE' },
  { name: 'order_type_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'status_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'ad_campaign_id', type: 'INTEGER', mode: 'NULLABLE' },
];

export const orderPartsTableSchema = [
  { name: 'order_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'entity_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'engineer_id', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'title', type: 'STRING', mode: 'NULLABLE' },
  { name: 'amount', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'price', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'cost', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'discount_value', type: 'FLOAT', mode: 'NULLABLE' },
  { name: 'code', type: 'STRING', mode: 'NULLABLE' },
  { name: 'article', type: 'STRING', mode: 'NULLABLE' },
  { name: 'warranty', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'warranty_period', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'uom_id', type: 'INTEGER', mode: 'NULLABLE' },
];

export const orderOperationsTableSchema = [
  { name: 'order_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'entity_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'engineer_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'title', type: 'STRING', mode: 'REQUIRED' },
  { name: 'amount', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'price', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'cost', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'discount_value', type: 'FLOAT', mode: 'REQUIRED' },
  { name: 'warranty', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'warranty_period', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'uom_id', type: 'INTEGER', mode: 'REQUIRED' },
];

export const orderAttachmentsTableSchema = [
  { name: 'order_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'created_at', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'created_by_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'filename', type: 'STRING', mode: 'REQUIRED' },
  { name: 'url', type: 'STRING', mode: 'REQUIRED' },
];

export const orders2ResourcesTableSchema = [
  { name: 'resource_id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'order_id', type: 'INTEGER', mode: 'REQUIRED' },
];

export const orderResourcesTableSchema = [
  { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'name', type: 'STRING', mode: 'REQUIRED' },
];

export const campaignsTableSchema = [
  { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'name', type: 'STRING', mode: 'REQUIRED' },
];
export const assetTableSchema = [
  { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'uid', type: 'STRING', mode: 'REQUIRED' },
  { name: 'title', type: 'STRING', mode: 'NULLABLE' },
  { name: 'color', type: 'STRING', mode: 'NULLABLE' },
  { name: 'state', type: 'STRING', mode: 'NULLABLE' },
  { name: 'cost', type: 'INTEGER', mode: 'NULLABLE' },
  { name: 'group', type: 'STRING', mode: 'NULLABLE' },
  { name: 'brand', type: 'STRING', mode: 'NULLABLE' },
  { name: 'model', type: 'STRING', mode: 'NULLABLE' },
  { name: 'modification', type: 'STRING', mode: 'NULLABLE' },
  { name: 'description', type: 'STRING', mode: 'NULLABLE' },
  { name: 'year', type: 'STRING', mode: 'NULLABLE' },
  { name: 'reg_number', type: 'STRING', mode: 'REQUIRED' },
  { name: 'owner_name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'warehouse', type: 'JSON', mode: 'REQUIRED' },
  { name: 'image', type: 'STRING', mode: 'NULLABLE' },
  { name: 'custom_fields', type: 'JSON', mode: 'REQUIRED' },
];
export const employeeTableSchema = [
  { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'email', type: 'STRING', mode: 'NULLABLE' },
  { name: 'first_name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'last_name', type: 'STRING', mode: 'NULLABLE' },
  { name: 'notes', type: 'STRING', mode: 'NULLABLE' },
  { name: 'phone', type: 'STRING', mode: 'NULLABLE' },
  { name: 'deleted', type: 'BOOLEAN', mode: 'REQUIRED' },
  { name: 'position', type: 'STRING', mode: 'NULLABLE' },
  { name: 'created_at', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'started_work', type: 'INTEGER', mode: 'REQUIRED' },
  { name: 'avatar', type: 'STRING', mode: 'NULLABLE' },
];
export const uomTableSchema = [
  { name: 'id', type: 'INTEGER' },
  { name: 'description', type: 'STRING' },
  { name: 'title', type: 'STRING' },
  { name: 'uom_type', type: 'STRING' },
  { name: 'is_imperial', type: 'BOOLEAN' },
  { name: 'is_system', type: 'BOOLEAN' },
  { name: 'entity_types', type: 'STRING', mode: 'REPEATED' },
];
export const closedPolishBitrixDealsTableSchema = [
  { name: 'id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'source_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'city_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'stage_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'is_rescheduled', type: 'BOOLEAN', mode: 'REQUIRED' },
  { name: 'date', type: 'DATE', mode: 'REQUIRED' },
];
export const bitrixDTPSchema = [
  {
    name: 'id',
    type: 'STRING',
    mode: 'REQUIRED',
    description:
      'Primary unique identifier for the DTP (Road Traffic Accident) deal.',
  },
  {
    name: 'driver_contact_id',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Identifier for the associated driver/contact.',
  },
  {
    name: 'debt_amount_crm',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'The debt amount recorded in the CRM.',
  },
  {
    name: 'repair_completion_date',
    type: 'TIMESTAMP',
    mode: 'NULLABLE',
    description: 'Date and time when the repair was completed.',
  },
  {
    name: 'transfer_to_collector',
    type: 'BOOL',
    mode: 'NULLABLE',
    description: 'Flag indicating if the debt was transferred to a collector.',
  },
  {
    name: 'city',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'City where the incident or related activity occurred.',
  },
  {
    name: 'dtp_date',
    type: 'TIMESTAMP',
    mode: 'NULLABLE',
    description: 'Date and time of the DTP (accident).',
  },
  {
    name: 'vehicle_license_plate',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'License plate number of the vehicle.',
  },
  {
    name: 'dtp_registration_type',
    type: 'STRING',
    mode: 'NULLABLE',
    description:
      'Type of DTP registration (e.g., Internal Repair, Police Report).',
  },
  {
    name: 'car_seizure_article',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Relevant article for car seizure, if applicable.',
  },
  {
    name: 'preliminary_repair_cost_photo',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Preliminary repair cost estimated from photos.',
  },
  {
    name: 'remonline_repair_sid',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Repair service ID from Remonline system.',
  },
  {
    name: 'repair_cost_by_sid',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Final repair cost as determined by the service ID.',
  },
  {
    name: 'actual_repair_cost_paid',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description:
      'Actual repair cost paid (can be negative for accounting purposes).',
  },
  {
    name: 'agreed_repair_amount',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'The agreed-upon repair amount.',
  },
  {
    name: 'additional_repair_expenses_uah',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Additional repair expenses in UAH.',
  },
  {
    name: 'credited_from_ins_co_uah',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Amount credited from the insurance company (UAH).',
  },
  {
    name: 'repair_paid_by_3rd_party_uah',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Repair cost paid by a 3rd party (UAH).',
  },
  {
    name: 'repair_paid_by_driver_collected',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Repair cost collected/paid by the driver.',
  },
  {
    name: 'dtp_driver_debt_uah',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Total driver debt related to the DTP (UAH).',
  },
  {
    name: 'dtp_fine_uah',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'DTP-related fine amount (UAH).',
  },
  {
    name: 'approved_by',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'ID of the user who approved the deal/transaction.',
  },
  {
    name: 'reimbursement_amount',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Total reimbursement amount.',
  },
  {
    name: 'independent_expert_evaluation',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Cost of independent expert evaluation.',
  },
  {
    name: 'was_property_found',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Indicator/ID related to whether property was found.',
  },
  {
    name: 'court_case_number',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Court case number, if applicable.',
  },
  {
    name: 'system_dtp_deal_id',
    type: 'STRING',
    mode: 'NULLABLE',
    description:
      "System ID for the DTP deal (duplicate of 'id' in the sample).",
  },
  {
    name: 'responsible_for_ins_payment',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'ID of the person responsible for insurance payment.',
  },
  {
    name: 'insurance_revenue',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Insurance revenue amount (can be negative).',
  },
  {
    name: 'ins_co_application_date',
    type: 'STRING',
    mode: 'NULLABLE',
    description:
      'Application date to the insurance company (kept as STRING due to empty value in sample).',
  },
  {
    name: 'ins_case_number',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Insurance case number.',
  },
  {
    name: 'funds_destination',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Destination of funds.',
  },
  {
    name: 'credited_from_ins_co_uah_1',
    type: 'BIGNUMERIC',
    mode: 'NULLABLE',
    description: 'Second instance of credited amount from ins. co. (UAH).',
  },
  {
    name: 'system_dtp_deal_id_paymen',
    type: 'STRING',
    mode: 'NULLABLE',
    description:
      "System ID for the DTP deal payment (duplicate of 'id' in the sample).",
  },
  {
    name: 'vehicle_status_in_company',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Status of the vehicle within the company.',
  },
  {
    name: 'vin_code',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Vehicle Identification Number.',
  },
  {
    name: 'production_year',
    type: 'INT64',
    mode: 'NULLABLE',
    description: 'Year the vehicle was produced.',
  },
  {
    name: 'mapon_id',
    type: 'INT64',
    mode: 'NULLABLE',
    description: 'Mapon vehicle tracking ID.',
  },
  {
    name: 'vehicle_model',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Make and model of the vehicle.',
  },
  {
    name: 'osago_expiry_date',
    type: 'TIMESTAMP',
    mode: 'NULLABLE',
    description: 'OSAGO (Mandatory Civil Liability Insurance) expiry date.',
  },
  {
    name: 'vehicle_owner',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'The registered owner of the vehicle.',
  },
  {
    name: 'branding',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Status of vehicle branding (e.g., Present).',
  },
  {
    name: 'license_status',
    type: 'STRING',
    mode: 'NULLABLE',
    description: "Status of the vehicle's operating license.",
  },
  {
    name: 'leasing_status',
    type: 'STRING',
    mode: 'NULLABLE',
    description: "Status of the vehicle's leasing arrangement.",
  },
  {
    name: 'driver_contact_name',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Name of the driver/contact.',
  },
  {
    name: 'stage_name',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Name of the deal stage.',
  },
  {
    name: 'blame',
    type: 'STRING',
    mode: 'NULLABLE',
    description:
      'Indication of fault/blame (e.g., Our driver, Not our driver).',
  },
  {
    name: 'stage',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Current stage of the deal.',
  },
  {
    name: 'approved_by_user',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Name of the user who approved the deal/transaction.',
  },
  {
    name: 'responsible_for_ins_payment_user',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Name of the person responsible for insurance payment.',
  },
  {
    name: 'auto_park_id',
    type: 'STRING',
    mode: 'NULLABLE',
    description: 'Unique identifier for the auto park/fleet.',
  },
];
