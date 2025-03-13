import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';

import {
  getFiredByDriversLogs,
  polandAutoParksIds,
} from '../../web.api.utlites.mjs';
import { clearTableByDate } from '../../../bq/bq-utils.mjs';
import { firedByDriversLogsTableSchema } from '../../../bq/schemas.mjs';
import {
  createOrResetTableByName,
  loadJsonToTable,
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'fired_by_drivers_logs';

const keywords = ['дубл', 'подмен', 'підмін', 'задвої', 'задвоил'];

export async function saveFiredByDriversLogs(manualDate) {
  const date =
    manualDate ||
    DateTime.now()
      .setZone('Europe/Kyiv')
      .minus({ days: 1 })
      .toFormat('yyyy-MM-dd');

  console.log({ time: new Date(), date, message: 'saveFiredByDriversLogs' });

  const { rows } = await getFiredByDriversLogs({ date });

  console.log({ getFiredByDriversLogs: rows.length });

  if (rows.length == 0) {
    return;
  }

  const jsonData = [];

  for (let row of rows) {
    let { comment, integrations, auto_park_id } = row;

    if (integrations == 0 && polandAutoParksIds.includes(auto_park_id)) {
      continue;
    }

    comment = comment.toLowerCase();
    comment = comment.replace(/\s+/g, '');
    if (keywords.some((keyword) => comment.includes(keyword))) {
      continue;
    }

    jsonData.push({
      ...row,
      date,
    });
  }

  if (jsonData.length == 0) {
    return;
  }

  await clearTableByDate({ bqTableId, date });
  const tempFilePath = path.join(
    os.tmpdir(),
    'temp_data_fired_by_drivers_logs.json'
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: firedByDriversLogsTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: firedByDriversLogsTableSchema })
  saveFiredByDriversLogs();
}
