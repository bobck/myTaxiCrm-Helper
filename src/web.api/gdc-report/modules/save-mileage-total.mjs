import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';

import { getMileagesAndHoursOnline } from '../../web.api.utlites.mjs';
import { clearTableByWeekAndYear } from '../../../bq/bq-utils.mjs';
import { mileagesAndHoursOnlineTableSchema } from '../../../bq/schemas.mjs';
import {
  createOrResetTableByName,
  loadJsonToTable,
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'mileages_and_hours_online';

export async function saveMileagesAndHoursOnline(dateTime) {
  const dateTimeReport =
    dateTime || DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 });
  const week = dateTimeReport.weekNumber;
  const year = dateTimeReport.year;

  console.log({
    time: new Date(),
    week,
    year,
    message: 'saveMileagesAndHoursOnline',
  });

  const { rows } = await getMileagesAndHoursOnline({ week, year });

  console.log({ getMileagesAndHoursOnline: rows.length });

  if (rows.length == 0) {
    return;
  }

  const jsonData = rows.map((row) => {
    return {
      ...row,
      year,
      week,
    };
  });

  await clearTableByWeekAndYear({ bqTableId, year, week });
  const tempFilePath = path.join(
    os.tmpdir(),
    'temp_data_mileages_and_hours_online.json'
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: mileagesAndHoursOnlineTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: mileagesAndHoursOnlineTableSchema })
  saveMileagesAndHoursOnline();
}
