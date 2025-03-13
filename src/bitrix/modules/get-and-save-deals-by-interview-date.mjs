import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';

import { getDealsByInterviewDate } from '../bitrix.utils.mjs';

import {
  createOrResetDealsHrInterviewTable,
  loadJsonToTable,
  clearTableByDate,
} from '../../bq/bq-utils.mjs';

import { dealsHrInterviewTableSchema } from '../../bq/schemas.mjs';

export async function getAndSaveDealsByInterviewDate(manualDate) {
  const date =
    manualDate ||
    DateTime.now()
      .setZone('Europe/Kyiv')
      .minus({ days: 1 })
      .toFormat('yyyy-MM-dd');
  console.log({
    time: new Date(),
    date,
    message: 'getAndSaveDealsByInterviewDate',
  });

  const bqTableId = 'deals_hr_interviewees';

  const result = await getDealsByInterviewDate({
    date,
  });

  console.log({
    getDealsByInterviewDate: result.length,
  });

  if (result.length == 0) {
    return;
  }

  const jsonData = result.map((row) => {
    const { ID, SOURCE_ID, STAGE_ID, UF_CRM_1527615815, UF_CRM_1722203030883 } =
      row;
    return {
      id: ID,
      source_id: SOURCE_ID,
      city_id: UF_CRM_1527615815,
      stage_id: STAGE_ID,
      is_rescheduled: UF_CRM_1722203030883 == '1' ? true : false,
      date,
    };
  });

  await clearTableByDate({
    bqTableId,
    date,
  });
  const tempFilePath = path.join(
    os.tmpdir(),
    'temp_data_deals_hr_interviewees.json'
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: dealsHrInterviewTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  const bqTableId = 'deals_hr_interviewees';
  // await createOrResetDealsHrInterviewTable({ bqTableId })
  await getAndSaveDealsByInterviewDate();
}
