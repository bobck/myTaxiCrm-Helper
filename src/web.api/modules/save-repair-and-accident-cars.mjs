import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';

import { getRepairAndAccidentCarsByDate } from '../web.api.utlites.mjs';
import { clearTableByDate } from '../../bq/bq-utils.mjs';
import { repairAndAccidentCarsTableSchema } from '../../bq/schemas.mjs';
import {
  createOrResetTableByName,
  loadJsonToTable,
} from '../../bq/bq-utils.mjs';

const bqTableId = 'repair_and_accident_cars';

export async function saveRepairAndAccidentCarsReport() {
  const date = DateTime.now()
    .setZone('Europe/Kyiv')
    .minus({ days: 1 })
    .toFormat('yyyy-MM-dd');

  console.log({
    time: new Date(),
    date,
    message: 'saveRepairAndAccidentCarsReport',
  });

  const { rows } = await getRepairAndAccidentCarsByDate({ date });

  console.log({ getRepairAndAccidentCarsByDate: rows.length });

  if (rows.length == 0) {
    return;
  }

  const jsonData = rows.map((row) => {
    return {
      ...row,
      date,
    };
  });

  await clearTableByDate({ bqTableId, date });
  const tempFilePath = path.join(
    os.tmpdir(),
    'temp_data_repair_and_accident_cars.json'
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: repairAndAccidentCarsTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: repairAndAccidentCarsTableSchema })
  saveRepairAndAccidentCarsReport();
}
