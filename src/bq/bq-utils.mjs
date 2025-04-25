import fs from 'fs';
import { BigQuery } from '@google-cloud/bigquery';
import { pool } from '../api/pool.mjs';
import {
  fuelReportTableSchema,
  dealsHrClosedTableSchema,
  dealsHrInterviewTableSchema,
  leadsTableSchema,
  fleetsIncomAndExpensesReportTableSchema,
  dealsHrRescheduledTableSchema,
} from './schemas.mjs';

const bigquery = new BigQuery({
  projectId: process.env.BQ_PROJECT_NAME,
  keyFilename: 'token.json',
});

export async function generateDriversWithFuelCardReport({ date }) {
  console.log({
    time: new Date(),
    message: 'generateDriversWithFuelCardReport',
  });

  const sqlp = fs
    .readFileSync('./src/sql/drivers_with_fuel_cards.sql')
    .toString();
  await pool.query("SET timezone='Europe/Kyiv';");
  const result = await pool.query(sqlp, [date]);
  const { rows } = result;
  return { rows };
}

export async function insertRowsAsStream({ dataset_id, rows, bqTableId }) {
  console.log({ dataset_id, rowsCount: rows.length, bqTableId });
  await bigquery
    .dataset(dataset_id || process.env.BQ_DATASET_ID)
    .table(bqTableId)
    .insert(rows);
}

export async function createTableReportTable() {
  console.log({ time: new Date(), message: 'createTableReportTable' });

  const options = {
    schema: fuelReportTableSchema,
    location: 'US',
  };
  const response = await bigquery
    .dataset(process.env.BQ_DATASET_ID)
    .createTable('drivers_with_fuel_card_report', options);
  console.log({ response });
}

export async function generateFleetsIncomAndExpensesReport({ year, week }) {
  console.log({
    time: new Date(),
    message: 'generateFleetsIncomAndExpensesReport',
  });

  const sqlp = fs
    .readFileSync('./src/sql/fleets_income_and_expenses_report.sql')
    .toString();
  await pool.query("SET timezone='Europe/Kyiv';");
  const result = await pool.query(sqlp, [year, week]);
  const { rows } = result;
  return { rows };
}

export async function createFleetsIncomAndExpensesReportTable() {
  console.log({
    time: new Date(),
    message: 'createFleetsIncomAndExpensesReportTable',
  });

  const options = {
    schema: fleetsIncomAndExpensesReportTableSchema,
    location: 'US',
  };
  const response = await bigquery
    .dataset(process.env.BQ_DATASET_ID)
    .createTable('fleet_income_and_expenses', options);
  console.log({ response });
}

export async function clearFleetsIncomAndExpensesReportTableByYearAndWeek({
  bqTableId,
  year,
  week,
}) {
  const query = `DELETE FROM \`${process.env.BQ_PROJECT_NAME}.${process.env.BQ_DATASET_ID}.${bqTableId}\` WHERE (year > ${year}) OR (year = ${year} AND week >= ${week})`;
  const options = {
    query: query,
    location: 'US',
  };

  await bigquery.query(options);
}

export async function createOrResetLeadsTable({ bqTableId }) {
  console.log({ time: new Date(), message: 'createOrResetLeadsTable' });
  try {
    await bigquery.dataset(process.env.BQ_DATASET_ID).table(bqTableId).delete();
  } catch (e) {}

  const options = {
    schema: leadsTableSchema,
    location: 'US',
  };
  const response = await bigquery
    .dataset(process.env.BQ_DATASET_ID)
    .createTable(bqTableId, options);
  console.log({ response });
}

export async function loadJsonToTable({ json, bqTableId, schema }) {
  const metadata = {
    sourceFormat: 'NEWLINE_DELIMITED_JSON',
    schema: { fields: schema },
    autodetect: true,
  };
  await bigquery
    .dataset(process.env.BQ_DATASET_ID)
    .table(bqTableId)
    .load(json, metadata);
}

export async function clearTableByDate({ bqTableId, date }) {
  const query = `DELETE FROM \`${process.env.BQ_PROJECT_NAME}.${process.env.BQ_DATASET_ID}.${bqTableId}\` WHERE date = '${date}'`;
  const options = {
    query: query,
    location: 'US',
  };

  await bigquery.query(options);
}

export async function clearTable({ bqTableId }) {
  const query = `DELETE FROM \`${process.env.BQ_PROJECT_NAME}.${process.env.BQ_DATASET_ID}.${bqTableId}\` where true = true`;
  const options = {
    query: query,
    location: 'US',
  };

  await bigquery.query(options);
}

export async function createOrResetDealsHrInterviewTable({ bqTableId }) {
  console.log({
    time: new Date(),
    message: 'createOrResetDealsHrInterviewTable',
  });

  try {
    await bigquery.dataset(process.env.BQ_DATASET_ID).table(bqTableId).delete();
  } catch (e) {}

  const options = {
    schema: dealsHrInterviewTableSchema,
    location: 'US',
  };
  const response = await bigquery
    .dataset(process.env.BQ_DATASET_ID)
    .createTable(bqTableId, options);
  console.log({ response });
}

export async function createOrResetDealsHrClosedTable({ bqTableId }) {
  console.log({ time: new Date(), message: 'createOrResetDealsHrClosedTable' });

  try {
    await bigquery.dataset(process.env.BQ_DATASET_ID).table(bqTableId).delete();
  } catch (e) {}

  const options = {
    schema: dealsHrClosedTableSchema,
    location: 'US',
  };
  const response = await bigquery
    .dataset(process.env.BQ_DATASET_ID)
    .createTable(bqTableId, options);
  console.log({ response });
}

export async function createOrResetDealsHrRescheduledTable({ bqTableId }) {
  console.log({
    time: new Date(),
    message: 'createOrResetDealsHrRescheduledTable',
  });

  try {
    await bigquery.dataset(process.env.BQ_DATASET_ID).table(bqTableId).delete();
  } catch (e) {}

  const options = {
    schema: dealsHrRescheduledTableSchema,
    location: 'US',
  };
  const response = await bigquery
    .dataset(process.env.BQ_DATASET_ID)
    .createTable(bqTableId, options);
  console.log({ response });
}

export async function clearTableByWeekAndYear({ bqTableId, week, year }) {
  const query = `DELETE FROM \`${process.env.BQ_PROJECT_NAME}.${process.env.BQ_DATASET_ID}.${bqTableId}\` WHERE year = ${year} and week = ${week}`;
  const options = {
    query: query,
    location: 'US',
  };

  await bigquery.query(options);
}

export async function clearTableByWeekAndYearAndAutoParkId({
  bqTableId,
  week,
  year,
  autoParkId,
}) {
  const query = `DELETE FROM \`${process.env.BQ_PROJECT_NAME}.${process.env.BQ_DATASET_ID}.${bqTableId}\` WHERE year = ${year} and week = ${week} and auto_park_id = '${autoParkId}'`;
  const options = {
    query: query,
    location: 'US',
  };

  await bigquery.query(options);
}

export async function createOrResetTableByName({
  bqTableId,
  schema,
  dataSetId,
}) {
  console.log({ time: new Date(), message: 'createOrResetTableByName' });
  const BQ_DATASET_ID = dataSetId || process.env.BQ_DATASET_ID;
  try {
    await bigquery.dataset(BQ_DATASET_ID).table(bqTableId).delete();
  } catch (e) {}

  const options = {
    schema,
    location: 'US',
  };
  const response = await bigquery
    .dataset(BQ_DATASET_ID)
    .createTable(bqTableId, options);
  // console.log({ response })
}

export async function generateCarsRoutsReport({ date }) {
  const sqlp = fs.readFileSync('./src/sql/cars_routs_report.sql').toString();
  const result = await pool.query(sqlp, [date]);
  const { rows } = result;
  return { rows };
}

export async function generatePolandBookkeepingReport({
  periodFrom,
  periodTo,
  autoParkId,
}) {
  const sqlp = fs.readFileSync('./src/sql/poland_bookkeeping.sql').toString();
  const result = await pool.query(sqlp, [periodFrom, periodTo, autoParkId]);
  const { rows } = result;
  return { rows };
}
export async function getBrandedLicencePlateNumbersFromBQ({
  existingBrandedLicencePlateNumbers,
}) {
  // the check is necessary because the BQ does not support null or undefined in the IN clause
  // and the query will fail if the array is empty
  const areBrandedLicencePlateNumbersEmpty =
    existingBrandedLicencePlateNumbers === undefined ||
    existingBrandedLicencePlateNumbers === null ||
    existingBrandedLicencePlateNumbers.length === 0;
  const query = areBrandedLicencePlateNumbersEmpty
    ? /*sql*/ `SELECT numbner as licence_plate_number FROM \`up-statistics.DB.brand_cars_status_list\` where approved_brand_type='BOLT'`
    : /*sql*/ `
    SELECT numbner AS licence_plate_number
    FROM \`up-statistics.DB.brand_cars_status_list\`
    WHERE approved_brand_type = 'BOLT'
      AND numbner NOT IN UNNEST(@existingNumbers)
  `;
  const options = {
    query,
    location: 'US',
  };
  if (!areBrandedLicencePlateNumbersEmpty) {
    options.params = { existingNumbers: existingBrandedLicencePlateNumbers };
  }
  //the response from BQ is an array with rows array as first element, and payload data next
  //this is the reason why here is array destructuring
  const [rows] = await bigquery.query(options);

  //the array mapping is required because the response has the shape[{ licence_plate_number: 'SOMEPLATENUMBER777' }]
  const brandedLicencePlateNumbers = rows.map(
    (row) => row.licence_plate_number
  );

  return { brandedLicencePlateNumbers };
}
