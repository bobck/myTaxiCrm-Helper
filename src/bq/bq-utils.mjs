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

export async function insertRowsAsStream(rows) {
    await bigquery.dataset(process.env.BQ_DATASET_ID).table(process.env.BQ_TABLE_ID).insert(rows);
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
    const response = await bigquery.dataset(process.env.BQ_DATASET_ID).createTable(process.env.BQ_TABLE_ID, options)
    console.log({ response })

}

if (process.env.ENV == "RESET_TABLE") {
    await bigquery.dataset(process.env.BQ_DATASET_ID).table(process.env.BQ_TABLE_ID).delete()
    await createTable()
}

if (process.env.ENV == "REWRITE_REPORT") {
    const date = process.env.REPORT_DATE;
    console.log({ env: 'REWRITE_REPORT', date })

    const query = `delete from \`${process.env.BQ_DATASET_ID}.${process.env.BQ_TABLE_ID}\` where date = '${date}'`
    await bigquery.dataset(process.env.BQ_DATASET_ID).table(process.env.BQ_TABLE_ID).query(query)

    const { rows } = await generateDriversWithFuelCardReport({ date });
    const mapRows = rows.map(r => {
        r.date = new Date(r.date).toISOString().split('T')[0]
        r.event_types = JSON.stringify(r.event_types)
        return r
    })
    await insertRowsAsStream(mapRows);

}
