import fs from 'fs';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';
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
export async function clearOrdersByIds({ bqTableId, ids }) {
  // Turn [1,2,3] → "1, 2, 3"
  const idsList = ids.join(', ');
  const query = `
    DELETE FROM \`${process.env.BQ_PROJECT_NAME}.RemOnline.${bqTableId}\`
    WHERE id IN (${idsList})
  `;
  const options = {
    query,
    location: 'US',
  };
  await bigquery.query(options);
}

/**
 * Deletes all rows from `datasetId.tableName` whose order_id matches one
 * of the IDs in `orders`. Runs as a single atomic DML job.
 *
 * @param {string} table_id  Name of the table (must be in ALLOWED_TABLES)
 * @param {{ id: number }[]} arrayToDelete  Array of { id } objects
 */
export async function deleteRowsByParameter({
  dataset_id,
  table_id,
  parameter,
  arrayToDelete,
}) {
  try {
    // Build the DELETE statement with the validated table name
    const sql = `
        DELETE FROM \`${process.env.BQ_PROJECT_NAME}.${dataset_id}.${table_id}\`
        WHERE ${parameter} IN UNNEST(@arrayToDelete)
      `;

    // Submit as a parameterized query job
    const [job] = await bigquery.createQueryJob({
      query: sql,
      location: 'US',
      params: { arrayToDelete },
      parameterMode: 'NAMED',
    });
    // Wait for completion
    await job.getQueryResults();
  } catch (error) {
    const info = {
      dataset_id,
      table_id,
      parameter,
      date: Date.now(),
    };
    throw { info, error };
  }
}

export async function loadRowsViaJSONFile({
  dataset_id,
  table_id,
  rows,
  schema,
}) {
  const tempFilePath = path.join(
    os.tmpdir(),
    `temp_data_${dataset_id}_${table_id}.json`
  );
  try {
    const jsonString = rows.map(JSON.stringify).join('\n');
    await writeFile(tempFilePath, jsonString);

    const metadata = {
      sourceFormat: 'NEWLINE_DELIMITED_JSON',
      schema: { fields: schema },
      // autodetect: true,
    };
    await bigquery
      .dataset(dataset_id)
      .table(table_id)
      .load(tempFilePath, metadata);
  } catch (err) {
    throw err;
  } finally {
    try {
      await unlink(tempFilePath);
    } catch (unlinkErr) {
      console.warn(`⚠️ Failed to delete temp file: ${tempFilePath}`, unlinkErr);
    }
  }
}
