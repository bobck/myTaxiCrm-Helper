import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';

import { getActiveDriversWithScheduleCompany } from '../../web.api.utlites.mjs';
import { clearTableByDate } from '../../../bq/bq-utils.mjs';
import { activeDriversWithScheduleCompanyTableSchema } from '../../../bq/schemas.mjs';
import {
  createOrResetTableByName,
  loadJsonToTable,
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'actives_with_schedule_company';

export async function saveActiveDriversWithScheduleCompany(manualDate) {
  const date =
    manualDate ||
    DateTime.now()
      .setZone('Europe/Kyiv')
      .minus({ days: 1 })
      .toFormat('yyyy-MM-dd');

  console.log({
    time: new Date(),
    date,
    message: 'saveActiveDriversWithScheduleCompany',
  });

  const { rows } = await getActiveDriversWithScheduleCompany({ date });

  console.log({ getActiveDriversWithScheduleCompany: rows.length });

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
    'temp_data_actives_with_schedule_company.json'
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: activeDriversWithScheduleCompanyTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: activeDriversWithScheduleCompanyTableSchema })
  saveActiveDriversWithScheduleCompany();
}
