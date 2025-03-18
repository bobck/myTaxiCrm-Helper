import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';

import { getActiveDriversWithScheduleEvents } from '../../web.api.utlites.mjs';
import { clearTableByDate } from '../../../bq/bq-utils.mjs';
import { activeDriversWithScheduleEventsTableSchema } from '../../../bq/schemas.mjs';
import {
  createOrResetTableByName,
  loadJsonToTable,
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'actives_with_schedule_events';

export async function saveActiveDriversWithScheduleEvents(manualDate) {
  const date =
    manualDate ||
    DateTime.now()
      .setZone('Europe/Kyiv')
      .minus({ days: 1 })
      .toFormat('yyyy-MM-dd');

  console.log({
    time: new Date(),
    date,
    message: 'saveActiveDriversWithScheduleEvents',
  });

  const { rows } = await getActiveDriversWithScheduleEvents({ date });

  console.log({ getActiveDriversWithScheduleEvents: rows.length });

  if (rows.length == 0) {
    return;
  }

  const jsonData = rows.map((row) => {
    let flow;
    const { id, temporary_leave_at, fired_out_time } = row;

    if (!temporary_leave_at && !fired_out_time) {
      flow = 'new';
    }

    if (temporary_leave_at && fired_out_time) {
      if (temporary_leave_at > fired_out_time) {
        flow = 'after_leave';
      }

      if (temporary_leave_at < fired_out_time) {
        flow = 'after_fired';
      }
    }

    if (temporary_leave_at && !fired_out_time) {
      flow = 'after_leave';
    }

    if (!temporary_leave_at && fired_out_time) {
      flow = 'after_fired';
    }

    return {
      ...row,
      flow,
      date,
    };
  });

  await clearTableByDate({ bqTableId, date });
  const tempFilePath = path.join(
    os.tmpdir(),
    'temp_data_actives_with_schedule_events.json'
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: activeDriversWithScheduleEventsTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: activeDriversWithScheduleEventsTableSchema })
  saveActiveDriversWithScheduleEvents();
}
