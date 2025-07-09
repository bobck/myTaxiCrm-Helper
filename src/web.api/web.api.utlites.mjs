import fetch from 'node-fetch';
import fs from 'fs';
import { setTimeout } from 'timers/promises';
import { pool } from './../api/pool.mjs';
import { globalLimiter } from './bottleneck.mjs';
import { UkrainianBrandingAutoParkIds } from '../bitrix/bitrix.constants.mjs';

async function makeCRMRequest({ body }) {
  const response = await fetch(process.env.WEB_API_ENDPOINT, {
    headers: {
      'content-type': 'application/json',
      authorization: process.env.WEB_API_AUTH,
    },
    method: 'POST',
    body: JSON.stringify(body),
  });

  const json = await response.json();

  const { errors, data } = json;

  if (errors) {
    throw errors;
  }

  return json;
}

async function makeCRMRequestWithRetry({ body }) {
  let retryDelay = 600;
  const maxRetries = 5;

  for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
    try {
      const response = await fetch(process.env.WEB_API_ENDPOINT, {
        headers: {
          'content-type': 'application/json',
          authorization: process.env.WEB_API_AUTH,
        },
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          `makeCRMRequestWithRetry HTTP error! status: ${response.status}`
        );
      }

      const json = await response.json();

      const { errors, data } = json;

      if (errors) {
        throw errors;
      }

      return json;
    } catch (error) {
      if (!Array.isArray(error)) {
        console.log({ error });
        throw error;
      }

      const [firstError] = error || [];
      const { message } = firstError || {};
      if (
        message == 'Cashbox balance after transaction become negative' ||
        message == 'Cashbox and contractor currencies must be the same'
      ) {
        throw new Error(message);
      }

      if (message == 'Driver bonus rule not found') {
        return { bonus_not_found: true };
      }

      // console.error(`Attempt ${retryCount + 1} failed. Retrying in ${retryDelay}ms.`);

      if (retryCount < maxRetries - 1) {
        await setTimeout(retryDelay);
        retryDelay *= 2;
      } else {
        console.error({ message: 'Max retries reached' });
        throw error;
      }
    }
  }
}

// export const makeCRMRequestlimited = globalLimiter.wrap(makeCRMRequest);
export const makeCRMRequestlimited = globalLimiter.wrap(
  makeCRMRequestWithRetry
);

const discountByDay = {
  Tuesday: 0.833,
  Wednesday: 0.667,
  Thursday: 0.5,
  Friday: 0.333,
};

export async function getDriversCandidatsForCustomTerms({
  isoDate,
  companyId,
  autoParksIds,
}) {
  console.log({ isoDate });

  const sql = fs
    .readFileSync('./src/sql/drivers_for_custom_terms.sql')
    .toString();

  const result = await pool.query(sql, [isoDate, companyId, autoParksIds]);
  const { rows, rowCount } = result;
  return { driversCandidatsForCustomTerms: rows };
}

async function getOriginalTariffs({ companyId, autoParksIds }) {
  const sql = fs
    .readFileSync('./src/sql/tariffs_to_be_discounted.sql')
    .toString();

  const result = await pool.query(sql, [companyId, autoParksIds]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getDiscountTariffsForAutoparksByDay({
  dayOfWeek,
  companyId,
  autoParksIds,
}) {
  const discount = discountByDay[dayOfWeek];
  console.log({ dayOfWeek, discount });

  let { rows } = await getOriginalTariffs({ companyId, autoParksIds });

  const uniqueAutoParkIds = [];

  rows.forEach((row) => {
    const autoParkId = row.auto_park_id;

    if (!uniqueAutoParkIds.includes(autoParkId)) {
      uniqueAutoParkIds.push(autoParkId);
    }
  });

  const discountTariffsForAutoparks = {};

  for (let autoParkId of uniqueAutoParkIds) {
    discountTariffsForAutoparks[autoParkId] = {};

    const autoparkRows = rows
      .filter((r) => r.auto_park_id == autoParkId)
      .reverse();
    const [firstRow] = autoparkRows;
    const {
      name,
      tax_percent,
      tax_type,
      target_marker,
      accounting,
      divisible_income_type,
      driver_fleet_bonuses_percent,
    } = firstRow;

    discountTariffsForAutoparks[autoParkId].name = name;
    discountTariffsForAutoparks[autoParkId].taxPercent = tax_percent;
    discountTariffsForAutoparks[autoParkId].taxType = tax_type;
    discountTariffsForAutoparks[autoParkId].targetMarker = target_marker;
    discountTariffsForAutoparks[autoParkId].accounting = accounting;
    discountTariffsForAutoparks[autoParkId].divisibleIncomeType =
      divisible_income_type;
    discountTariffsForAutoparks[autoParkId].driverFleetBonusesPercent =
      driver_fleet_bonuses_percent;
    discountTariffsForAutoparks[autoParkId].tariffRules = [];

    let prevTo = null;
    for (let row of autoparkRows) {
      const rule = {};

      if (row.from != 0) {
        rule.from = Math.round(row.from * discount);
      }

      if (prevTo) {
        rule.to = prevTo;
        prevTo = null;
      }

      prevTo = rule.from - 1;

      rule.rate = row.rate;
      rule.isRateInPercent = true;

      discountTariffsForAutoparks[autoParkId].tariffRules.unshift(rule);
    }
    prevTo = null;
  }

  return { discountTariffsForAutoparks };
}

async function getOriginalBonuses({ companyId, autoParksIds }) {
  const sql = fs
    .readFileSync('./src/sql/bonuses_to_be_discounted.sql')
    .toString();

  const result = await pool.query(sql, [companyId, autoParksIds]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getDiscountBonusesByAutoparksAndIntegrationsByDay({
  dayOfWeek,
  companyId,
  autoParksIds,
}) {
  const discount = discountByDay[dayOfWeek];
  console.log({ dayOfWeek, discount });

  let { rows } = await getOriginalBonuses({ companyId, autoParksIds });
  const discountBonusesByAutoparksAndIntegrations = [];
  for (let bonuseRuleCard of rows) {
    const createDriverBonusRulesInput = {};
    const { auto_park_id, avg_check_rules, integration_ids, trips_rules } =
      bonuseRuleCard;

    createDriverBonusRulesInput.autoParkId = auto_park_id;
    createDriverBonusRulesInput.bonusRules = {};
    createDriverBonusRulesInput.bonusRules.integrationIds = integration_ids;

    createDriverBonusRulesInput.bonusRules.avgCheckRules = [];

    for (let avg_check_rule of avg_check_rules) {
      if (avg_check_rule.to === 1000000) {
        delete avg_check_rule.to;
      }
      createDriverBonusRulesInput.bonusRules.avgCheckRules.push(avg_check_rule);
    }

    createDriverBonusRulesInput.bonusRules.tripsRules = [];

    let prevTo = null;
    for (let row of trips_rules.reverse()) {
      const rule = {};

      if (row.from != 0) {
        rule.from = Math.round(row.from * discount);
      }

      if (prevTo) {
        rule.to = prevTo;
        prevTo = null;
      }

      prevTo = rule.from - 1;

      rule.bonusValues = row.bonusValues;

      createDriverBonusRulesInput.bonusRules.tripsRules.unshift(rule);
    }

    discountBonusesByAutoparksAndIntegrations.push(createDriverBonusRulesInput);
  }

  return { discountBonusesByAutoparksAndIntegrations };
}

export async function createCashlessPaymentApplication({
  type,
  autoParkId,
  cashboxId,
  expenseType,
  carId,
  sum,
  contractorId,
  payByDate,
  comment,
}) {
  const body = {
    operationName: 'CreateCashlessPaymentApplication',
    variables: {
      createCashlessPaymentApplicationInput: {
        type,
        autoParkId,
        cashboxId,
        expenseType,
        sum,
        carId,
        contractorId,
        payByDate,
        comment,
      },
    },
    query:
      'mutation CreateCashlessPaymentApplication($createCashlessPaymentApplicationInput: CreateCashlessPaymentApplicationInput!) {\n  createCashlessPaymentApplication(\n    createCashlessPaymentApplicationInput: $createCashlessPaymentApplicationInput\n  ) {\n    id\n    __typename\n  }\n}\n',
  };
  const { data } = await makeCRMRequestlimited({ body });
  const { createCashlessPaymentApplication: cashlessPaymentApplication } = data;
  return { cashlessPaymentApplication };
}

export async function editCashlessPaymentApplication({
  applicationId,
  status,
}) {
  const body = {
    operationName: 'EditCashlessPaymentApplication',
    variables: {
      editCashlessPaymentApplicationInput: {
        applicationId,
        status,
      },
    },
    query:
      'mutation EditCashlessPaymentApplication($editCashlessPaymentApplicationInput: EditCashlessPaymentApplicationInput!) {\n  editCashlessPaymentApplication(\n    editCashlessPaymentApplicationInput: $editCashlessPaymentApplicationInput\n  ) {\n    status\n    __typename\n  }\n}\n',
  };
  const { data } = await makeCRMRequestlimited({ body });
  const { editCashlessPaymentApplication: cashlessPaymentApplication } = data;
  return { cashlessPaymentApplication };
}

export async function payApplication({ applicationId, autoParkId }) {
  const body = {
    operationName: 'PayApplication',
    variables: {
      payApplicationInput: {
        applicationId,
        autoParkId,
      },
    },
    query:
      'mutation PayApplication($payApplicationInput: PayApplicationInput!) {\n  payApplication(payApplicationInput: $payApplicationInput) {\n    success\n    __typename\n  }\n}\n',
  };
  const { data } = await makeCRMRequestlimited({ body });
  const { payApplication } = data;
  return { payApplication };
}

export const repairExpensesTypes = {
  0.1: 'CALCULATED_STATEMENT_CORRECTION',
  2.1: 'GASOLINE',
  2.13: 'CAR_WASH',
  2.2: 'GAS',
  2.21: 'DIESEL_FUEL',
  2.4: 'SPARE_PARTS_BY_URGENT_REPAIR',
  2.41: 'SPARE_PARTS_BY_WAREHOUSE',
  2.5: 'SPARE_PARTS_BY_ROAD_ACCIDENT',
  2.52: 'REPAIR_WORK',
  2.532: 'TIRE_BYING',
  2.54: 'MAINTENANCE_STATION_SUPPLIES',
  2.55: 'MAINTENANCE_STATION_EQUIPMENT',
  2.56: 'MAINTENANCE_STATION_SERVICES',
  2.8: 'TOP_UP_TELEPHONE_BALANCE',
  2.9: 'PURCHASE_SUPPLIES',
  3.2: 'SALARY_OR_ADVANCE_OFFICE',
  3.209: 'SALARY_OR_ADVANCE_OFFICE_CENTRAL',
  3.5: 'TRAVEL_COSTS_OFFICE',
  3.6: 'HOSPITALITY',
  3.91: 'KPI_BONUSES',
  3.919: 'WORK_BONUS_OFFICE_CENTRAL',
  3.92: 'WORK_BONUS_OFFICE',
  4.1: 'ROOM_RENTAL',
  4.2: 'UTILITY_BILLS',
  4.21: 'UTILITY_BILLS_METERS',
  4.3: 'STATIONARY',
  4.4: 'HOUSEHOLD_GOODS',
  4.41: 'DOCUMENT_FLOW',
  4.42: 'DELIVERY',
  4.5: 'CATERING_OFFICE',
  4.6: 'OFFICE_TRANSPORTATION',
  4.7: 'ADVERTISING',
  4.8: 'REPAIR_OFFICE',
  4.809: 'REPAIR_OFFICE_CENTRAL',
  4.9: 'EQUIPMENT_OFFICE',
  5.3: 'BANK_COMMISSION',
  5.4: 'SIDE_CAR_RENTAL',
  8.1: 'TAXES',
  '3.3.1': 'DRIVER_MOTIVATION_PROGRAM',
  5.1: 'ENCASHMENT',
};

export async function getContractorsList() {
  const sql = fs.readFileSync('./src/sql/get_contractors_list.sql').toString();

  const result = await pool.query(sql);
  const { rows, rowCount } = result;
  return { contractorsList: rows };
}

export async function getCompanyDriversAutoparkRevenue({
  autoParksIds,
  fromYear,
  fromWeek,
}) {
  const sql = fs
    .readFileSync('./src/sql/company_drivers_auto_park_revenue.sql')
    .toString();
  const result = await pool.query(sql, [autoParksIds, fromYear, fromWeek]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getWorkingDriversWithHistoryStatus({ date }) {
  const sql = fs
    .readFileSync(
      './src/sql/gdc-report/working_drivers_with_history_status.sql'
    )
    .toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getUniqWorkedDriversAndAvgLifeTime({ week, year }) {
  const sql = fs
    .readFileSync(
      './src/sql/gdc-report/uniq_worked_drivers_and_avg_life_time.sql'
    )
    .toString();
  const result = await pool.query(sql, [week, year]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getTemporaryLeaveByDriversEditingHistory({ date }) {
  const sql = fs
    .readFileSync(
      './src/sql/gdc-report/temporary_leave_by_drivers_editing_history.sql'
    )
    .toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getMileagesAndHoursOnline({ week, year }) {
  const sql = fs
    .readFileSync('./src/sql/gdc-report/mileages_and_hours_online.sql')
    .toString();
  const result = await pool.query(sql, [week, year]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getFiredByDriversLogs({ date }) {
  const sql = fs
    .readFileSync('./src/sql/gdc-report/fired_by_drivers_logs.sql')
    .toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getCarUsageReport({ date }) {
  const sql = fs
    .readFileSync('./src/sql/gdc-report/car_usage_report.sql')
    .toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getDriversWithActiveBonusesByDriverId({ driversIds }) {
  const sqlp = fs
    .readFileSync('./src/sql/drivers_with_active_bonuses.sql')
    .toString();
  const result = await pool.query(sqlp, [driversIds]);
  const { rows } = result;
  return { rows };
}

export const polandAutoParksIds = [
  'de4bf8ba-30c2-452c-a688-104063052961',
  '58ea1e9e-ebdd-4c4d-870c-6ef06e868c60',
  'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b',
];

export async function getCarTransferAcceptanceList({ date }) {
  const sql = fs
    .readFileSync(
      'src/sql/inflow-outflow-drivers-report/car_transfer_acceptance_list.sql'
    )
    .toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getCarTransferAcceptanceCompany({ date }) {
  const sql = fs
    .readFileSync(
      'src/sql/inflow-outflow-drivers-report/car_transfer_acceptance_company.sql'
    )
    .toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getActiveDriversWithScheduleCompany({ date }) {
  const sql = fs
    .readFileSync(
      'src/sql/inflow-outflow-drivers-report/actives_with_schedule_company.sql'
    )
    .toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getActiveDriversWithScheduleEvents({ date }) {
  const sql = fs
    .readFileSync(
      'src/sql/inflow-outflow-drivers-report/actives_with_schedule_events.sql'
    )
    .toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getDriverByContract({ contract }) {
  const sql = fs.readFileSync('src/sql/get_driver_by_contract.sql').toString();
  const result = await pool.query(sql, [contract]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getDriverTripsCountByPeriod({
  driver_id,
  auto_park_id,
  periodStartDate,
  periodEndDate,
}) {
  const sql = fs
    .readFileSync('src/sql/get_driver_trips_count_by_period.sql')
    .toString();
  const result = await pool.query(sql, [
    driver_id,
    auto_park_id,
    periodStartDate,
    periodEndDate,
  ]);
  const { rows, rowCount } = result;

  if (rowCount == 0) {
    return { trips: 0 };
  }
  const [row] = rows;
  const { trips } = row;
  return { trips };
}

export async function getRevenueDetailsForRefferalsProcentageReward({
  activeRefferalsIds,
  week,
  year,
}) {
  const sql = fs
    .readFileSync(
      'src/sql/get_revenue_details_for_refferals_procentage_reward.sql'
    )
    .toString();
  const result = await pool.query(sql, [activeRefferalsIds, week, year]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getRepairAndAccidentCarsByDate({ date }) {
  const sql = fs.readFileSync('src/sql/repair-accident-report.sql').toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getNewWorkingDriversByDate({ date }) {
  const sql = fs.readFileSync('src/sql/new_drivers_by_date.sql').toString();
  const result = await pool.query(sql, [date]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getWorkingDriversById({ driversIds }) {
  const sql = fs.readFileSync('src/sql/working_drivers_by_id.sql').toString();
  const result = await pool.query(sql, [driversIds]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getBrandingCarsInfo({
  brandedLicencePlateNumbers,
  period_from,
}) {
  const sql = fs.readFileSync('src/sql/get-branding-cars-info.sql').toString();
  const result = await pool.query(sql, [
    brandedLicencePlateNumbers,
    period_from,
  ]);
  const { rows, rowCount } = result;
  return { rows };
}
export async function getDriverBalances({ driver_ids }) {
  const sql = fs.readFileSync('src/sql/get_driver_balances.sql').toString();
  const result = await pool.query(sql, [driver_ids]);
  const { rows, rowCount } = result;
  return { rows };
}
export async function getFiredDebtorDriversInfo({
  fired_debtor_drivers_with_existing_bitrix_cards,
}) {
  const sql = fs
    .readFileSync('src/sql/get_fired_debtor_drivers.sql')
    .toString();
  const result = await pool.query(sql, [
    UkrainianBrandingAutoParkIds,
    fired_debtor_drivers_with_existing_bitrix_cards,
  ]);
  const { rows, rowCount } = result;
  return { rows };
}
export async function getHandledCashBlockRulesInfo({ fired_drivers_ids }) {
  const sql = fs
    .readFileSync('src/sql/get_handled_cash_block_rules.sql')
    .toString();
  const result = await pool.query(sql, [fired_drivers_ids]);
  const { rows, rowCount } = result;
  return { rows };
}
export async function getAllWorkingDriverIds({
  ids,
  weekNumber,
  year,
  activationValue,
}) {
  // console.log(arguments)
  const sql = fs
    .readFileSync('src/sql/get_all_working_driver_ids.sql')
    .toString();
  const result = await pool.query(sql, [
    ids,
    weekNumber,
    year,
    activationValue,
  ]);
  const { rows, rowCount } = result;
  return { rows };
}
//getDriversWhoPaidOff
export async function getDriversWhoPaidOff({ ids, weekNumber, year }) {
  const sql = fs
    .readFileSync('src/sql/get_drivers_who_paid_off.sql')
    .toString();
  const result = await pool.query(sql, [ids, weekNumber, year]);
  const { rows, rowCount } = result;
  return { rows };
}
export async function getTheMostRecentDriverCashBlockRuleIdByDriverId({
  driver_id,
}) {
  const sql = fs
    .readFileSync(
      'src/sql/get_the_most_recent_driver_cash_block_rule_by_driver_id.sql'
    )
    .toString();
  const result = await pool.query(sql, [driver_id]);
  const { rows, rowCount } = result;
  return { rows };
}