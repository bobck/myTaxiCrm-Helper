import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';
import { openSShTunnel } from '../../../../ssh.mjs';
import{getDealsByStageEnteredDate} from '../../../bitrix/bitrix.utils.mjs';
import {
  getWorkingDriversWithHistoryStatus,
  polandAutoParksIds,
} from '../../web.api.utlites.mjs';
import { clearTableByDate } from '../../../bq/bq-utils.mjs';
import { workingDriversTableSchema } from '../../../bq/schemas.mjs';
import {
  createOrResetTableByName,
  loadJsonToTable,
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'new_drivers_added';

export async function saveWorkingDriversWithHistoryStatus(manualDate) {
  const date =
    manualDate ||
    DateTime.now()
      .setZone('Europe/Kyiv')
      .minus({ days: 1 })
      .toFormat('yyyy-MM-dd');

  console.log({
    time: new Date(),
    date,
    message: 'saveWorkingDriversWithHistoryStatus',
  });

  const { rows } = await getWorkingDriversWithHistoryStatus({ date });
  console.log(rows);
  console.log({ getWorkingDriversWithHistoryStatus: rows.length });
  return;
  if (rows.length == 0) {
    return;
  }

  const jsonData = [];

  for (let row of rows) {
    const {
      temporary_leave_at,
      fired_out_time,
      integrations,
      auto_park_id,
      id,
    } = row;

    if (integrations == 0 && polandAutoParksIds.includes(auto_park_id)) {
      continue;
    }

    let type;

    if (!temporary_leave_at && !fired_out_time) {
      type = 'NEW';
    }

    if (temporary_leave_at && !fired_out_time) {
      type = 'FROM_TEMPORARY';
    }

    if (!temporary_leave_at && fired_out_time) {
      type = 'FROM_FIRED';
    }

    if (temporary_leave_at && fired_out_time) {
      if (temporary_leave_at > fired_out_time) {
        type = 'FROM_TEMPORARY';
      }

      if (temporary_leave_at < fired_out_time) {
        type = 'FROM_FIRED';
      }
    }

    jsonData.push({
      ...row,
      type,
      date,
    });
  }

  if (jsonData.length == 0) {
    return;
  }

  await clearTableByDate({ bqTableId, date });
  const tempFilePath = path.join(
    os.tmpdir(),
    'temp_data_new_drivers_added.json'
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: workingDriversTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: workingDriversTableSchema })

  // await openSShTunnel;
  // await saveWorkingDriversWithHistoryStatus('2025-04-28');
  const a= await getDealsByStageEnteredDate({stage_id: 'C40:WON', date: '2025-04-28',category_id: 40});
  console.log(a);
}
