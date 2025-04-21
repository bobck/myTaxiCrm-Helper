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
 * Utility functions to batch-insert rows into one or more BigQuery tables in parallel.
 *
 * Usage example for single table:
 *   const rows = [ { name: 'Alice', age: 30 }, { name: 'Bob', age: 25 } ];
 *   await loadRows('my_dataset', 'my_table', rows);
 *
 * Usage example for multiple tables:
 *   const jobs = [
 *     { datasetId: 'ds1', tableId: 'table1', rows: rows1 },
 *     { datasetId: 'ds2', tableId: 'table2', rows: rows2 },
 *     // ... up to 6 or more tables
 *   ];
 *   await loadMultipleTables(jobs, { tableConcurrency: 3, chunkSize: 500 });
 */

/**
 * Inserts rows into a single BigQuery table in chunks to respect API limits.
 * @param {string} dataset_id - BigQuery dataset name.
 * @param {string} table_id - BigQuery table name.
 * @param {object[]} rows - Array of row objects to insert.
 * @param {object} [options]
 * @param {number} [options.chunkSize=500] - Number of rows per insert call (max ~10,000, recommended ~500).
 */
async function loadRows({ dataset_id, table_id, rows, options }) {
  const dataset = bigquery.dataset(dataset_id);
  const table = dataset.table(table_id);
  const { chunkSize } = options;

  // console.log(
  //   `Starting insert to ${dataset_id}.${table_id}: ${rows.length} rows`
  // );
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    try {
      // console.log(`inserting chunk :`,chunk)
      await table.insert(chunk);
      // console.log(
      //   `  [${dataset_id}.${table_id}] Inserted rows ${i + 1}–${i + chunk.length}`
      // );
    } catch (err) {
      console.error(
        `  [${dataset_id}.${table_id}] Error inserting rows ${i + 1}–${i + chunk.length}:`
      );
      err.errors.forEach((error) => {
        if (error.errors) {
          if (error.errors[0].message !== '') {
            console.error(error);
          }
        }
        console.log(error);
      });
      // console.error(err)
    }
  }
}

/**
 * Loads multiple tables in parallel, with optional concurrency limits.
 * @param {Array<{dataset_id:string,table_id:string,rows:object[]}>} jobs - List of load jobs.
 * @param {object} [options]
 * @param {number} [options.tableConcurrency=jobs.length] - How many tables to load in parallel.
 * @param {number} [options.chunkSize=500] - Number of rows per insert call for each job.
 */
export async function loadMultipleTables({ jobs, options = {} }) {
  const tableConcurrency = options.tableConcurrency || jobs.length;
  const chunkSize = options.chunkSize || 500;

  console.log(
    `Starting parallel load for ${jobs.length} tables (concurrency: ${tableConcurrency})`
  );
  // Create a simple concurrency pool
  const queue = [...jobs];
  const active = [];

  async function runNext() {
    if (queue.length === 0) return;
    const job = queue.shift();
    const promise = loadRows({
      dataset_id: job.dataset_id,
      table_id: job.table_id,
      rows: job.rows,
      options: { chunkSize },
    })
      .then(() =>
        console.log(`Completed load for ${job.dataset_id}.${job.table_id}`)
      )
      .catch((err) =>
        console.error(`Failed load for ${job.dataset_id}.${job.table_id}:`, err)
      );
    active.push(promise);
    // When one finishes, remove it and start next
    promise.finally(() => {
      active.splice(active.indexOf(promise), 1);
      runNext();
    });
  }

  // Kick off initial batch
  for (let i = 0; i < tableConcurrency && i < jobs.length; i++) {
    runNext();
  }

  // Wait for all to finish
  await Promise.all(active);
  console.log('All table loads completed.');
}

/**
 * Deletes all rows from `datasetId.tableName` whose order_id matches one
 * of the IDs in `orders`. Runs as a single atomic DML job.
 *
 * @param {string} table_id  Name of the table (must be in ALLOWED_TABLES)
 * @param {{ id: number }[]} order_ids  Array of { id } objects
 */
export async function deleteRowsByOrderId({ table_id, order_ids }) {
  if (!order_ids.length) {
    return;
  }
  const dataset_id = 'RemOnline';
  // Build the DELETE statement with the validated table name
  const sql = `
    DELETE FROM \`${process.env.BQ_PROJECT_NAME}.${dataset_id}.${table_id}\`
    WHERE ${table_id === 'orders' ? 'id' : 'order_id'} IN UNNEST(@order_ids)
  `;

  // Submit as a parameterized query job
  const [job] = await bigquery.createQueryJob({
    query: sql,
    location: 'US',
    params: { order_ids },
    parameterMode: 'NAMED',
  });

  console.log(`Started delete job ${job.id} on ${table_id}…`);
  // Wait for completion
  const [result] = await job.getQueryResults();
  console.log(`Deleted ${result.totalRows} rows from ${table_id}.`);
}
