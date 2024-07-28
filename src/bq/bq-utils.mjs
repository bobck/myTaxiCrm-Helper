import fs from 'fs'
import { BigQuery } from '@google-cloud/bigquery';
import { pool } from '../api/pool.mjs';
import {
    fuelReportTableSchema,
    dealsHrClosedTableSchema,
    dealsHrInterviewTableSchema,
    leadsTableSchema,
    fleetsIncomAndExpensesReportTableSchema
} from './schemas.mjs';

const bigquery = new BigQuery({
    projectId: process.env.BQ_PROJECT_NAME,
    keyFilename: 'token.json'
});

export async function generateDriversWithFuelCardReport({ date }) {

    console.log({ time: new Date(), message: 'generateDriversWithFuelCardReport' })

    const sqlp = fs.readFileSync('./src/sql/drivers_with_fuel_cards.sql').toString();
    await pool.query("SET timezone='Europe/Kyiv';");
    const result = await pool.query(sqlp, [date]);
    const { rows } = result
    return { rows }
}

export async function insertRowsAsStream({ rows, bqTableId }) {
    await bigquery.dataset(process.env.BQ_DATASET_ID).table(bqTableId).insert(rows);
}


export async function createTableReportTable() {
    console.log({ time: new Date(), message: 'createTableReportTable' })

    const options = {
        schema: fuelReportTableSchema,
        location: 'US',
    };
    const response = await bigquery.dataset(process.env.BQ_DATASET_ID).createTable('drivers_with_fuel_card_report', options)
    console.log({ response })

}

export async function generateFleetsIncomAndExpensesReport({ year, week }) {

    console.log({ time: new Date(), message: 'generateDriversWithFuelCardReport' })

    const sqlp = fs.readFileSync('./src/sql/fleets_income_and_expenses_report.sql').toString();
    await pool.query("SET timezone='Europe/Kyiv';");
    const result = await pool.query(sqlp, [year, week]);
    const { rows } = result
    return { rows }
}

export async function createFleetsIncomAndExpensesReportTable() {
    console.log({ time: new Date(), message: 'createFleetsIncomAndExpensesReportTable' })

    const options = {
        schema: fleetsIncomAndExpensesReportTableSchema,
        location: 'US',
    };
    const response = await bigquery.dataset(process.env.BQ_DATASET_ID).createTable('fleet_income_and_expenses', options)
    console.log({ response })

}

export async function clearFleetsIncomAndExpensesReportTableByYearAndWeek({ bqTableId, year, week }) {
    const query = `DELETE FROM \`${process.env.BQ_PROJECT_NAME}.${process.env.BQ_DATASET_ID}.${bqTableId}\` WHERE (year > ${year}) OR (year = ${year} AND week >= ${week})`;
    const options = {
        query: query,
        location: 'US',
    };

    await bigquery.query(options);
}

export async function createOrResetLeadsTable({ bqTableId }) {
    console.log({ time: new Date(), message: 'createOrResetLeadsTable' })

    try {
        await bigquery.dataset(process.env.BQ_DATASET_ID).table(bqTableId).delete()
    } catch (e) {

    }

    const options = {
        schema: leadsTableSchema,
        location: 'US',
    };
    const response = await bigquery.dataset(process.env.BQ_DATASET_ID).createTable(bqTableId, options)
    console.log({ response })
}

export async function loadJsonToTable({ json, bqTableId, schema }) {
    const metadata = {
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        schema: { fields: schema },
        autodetect: true,
    };
    await bigquery.dataset(process.env.BQ_DATASET_ID).table(bqTableId).load(json, metadata);
}

export async function clearTableByDate({ bqTableId, date }) {
    const query = `DELETE FROM \`${process.env.BQ_PROJECT_NAME}.${process.env.BQ_DATASET_ID}.${bqTableId}\` WHERE date = '${date}'`;
    const options = {
        query: query,
        location: 'US',
    };

    await bigquery.query(options);
}

export async function createOrResetDealsHrInterviewTable({ bqTableId }) {
    console.log({ time: new Date(), message: 'createOrResetDealsHrInterviewTable' })

    try {
        await bigquery.dataset(process.env.BQ_DATASET_ID).table(bqTableId).delete()
    } catch (e) {

    }

    const options = {
        schema: dealsHrInterviewTableSchema,
        location: 'US',
    };
    const response = await bigquery.dataset(process.env.BQ_DATASET_ID).createTable(bqTableId, options)
    console.log({ response })
}

export async function createOrResetDealsHrClosedTable({ bqTableId }) {
    console.log({ time: new Date(), message: 'createOrResetDealsHrClosedTable' })

    try {
        await bigquery.dataset(process.env.BQ_DATASET_ID).table(bqTableId).delete()
    } catch (e) {

    }

    const options = {
        schema: dealsHrClosedTableSchema,
        location: 'US',
    };
    const response = await bigquery.dataset(process.env.BQ_DATASET_ID).createTable(bqTableId, options)
    console.log({ response })
}