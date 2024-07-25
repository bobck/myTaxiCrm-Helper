import fs from 'fs'
import { BigQuery } from '@google-cloud/bigquery';
import { pool } from '../api/pool.mjs';

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

    const schema = [
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

    const options = {
        schema,
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

    const schema = [
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

    const options = {
        schema,
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