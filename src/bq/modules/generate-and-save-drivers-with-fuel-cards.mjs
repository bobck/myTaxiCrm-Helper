import { generateDriversWithFuelCardReport, createTableReportTable, insertRowsAsStream } from '../bq-utils.mjs';
import { DateTime } from 'luxon';

export async function generateAndSaveDriversWithFuelCardsReport() {
  console.log({
    time: new Date(),
    message: 'generateAndSaveDriversWithFuelCardsReport',
  });

  const date = DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');
  const { rows } = await generateDriversWithFuelCardReport({ date });
  const rowsMapped = rows.map((r) => {
    r.date = new Date(r.date).toISOString().split('T')[0];
    r.event_types = JSON.stringify(r.event_types);
    return r;
  });
  await insertRowsAsStream({
    rows: rowsMapped,
    bqTableId: 'drivers_with_fuel_card_report',
  });
}

if (process.env.ENV == 'RESET_TABLE') {
  await bigquery.dataset(process.env.BQ_DATASET_ID).table('drivers_with_fuel_card_report').delete();
  await createTableReportTable();
}

if (process.env.ENV == 'REWRITE_REPORT') {
  const date = process.env.REPORT_DATE;
  console.log({ env: 'REWRITE_REPORT', date });

  const query = `delete from \`${process.env.BQ_DATASET_ID}.${'drivers_with_fuel_card_report'}\` where date = '${date}'`;
  await bigquery.dataset(process.env.BQ_DATASET_ID).table('drivers_with_fuel_card_report').query(query);

  const { rows } = await generateDriversWithFuelCardReport({ date });
  const mapRows = rows.map((r) => {
    r.date = new Date(r.date).toISOString().split('T')[0];
    r.event_types = JSON.stringify(r.event_types);
    return r;
  });
  await insertRowsAsStream({
    rows: mapRows,
    bqTableId: 'drivers_with_fuel_card_report',
  });
}
