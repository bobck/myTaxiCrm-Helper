import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';

import { getDealsRescheduled } from '../bitrix.utils.mjs';

import {
  createOrResetDealsHrRescheduledTable,
  loadJsonToTable,
  clearTableByWeekAndYear,
} from '../../bq/bq-utils.mjs';

import { dealsHrRescheduledTableSchema } from '../../bq/schemas.mjs';

export async function getAndSaveDealsRescheduled(dateTime) {
  const dateTimeReport =
    dateTime || DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 });
  const week = dateTimeReport.weekNumber;
  const year = dateTimeReport.year;

  console.log({
    time: new Date(),
    week,
    year,
    message: 'getAndSaveDealsRescheduled',
  });

  const bqTableId = 'deals_hr_rescheduled';

  const result = await getDealsRescheduled();

  console.log({ getDealsRescheduled: result.length });

  if (result.length == 0) {
    return;
  }

  const jsonData = result.map((row) => {
    const { ID, SOURCE_ID, UF_CRM_1527615815 } = row;
    return {
      id: ID,
      source_id: SOURCE_ID,
      city_id: UF_CRM_1527615815,
      year,
      week,
    };
  });

  await clearTableByWeekAndYear({ bqTableId, week, year });
  const tempFilePath = path.join(
    os.tmpdir(),
    'temp_data_deals_hr_rescheduled.json'
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: dealsHrRescheduledTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  const bqTableId = 'deals_hr_rescheduled';
  // await createOrResetDealsHrRescheduledTable({ bqTableId })
  await getAndSaveDealsRescheduled();
}
