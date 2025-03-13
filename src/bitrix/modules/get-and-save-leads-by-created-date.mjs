import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';

import {
  getLeadsByCreateDateAndAssigned,
  getLeadsByCreateDateAndSourceId,
} from '../bitrix.utils.mjs';

import {
  createOrResetLeadsTable,
  loadJsonToTable,
  clearTableByDate,
} from '../../bq/bq-utils.mjs';

import { leadsTableSchema } from '../../bq/schemas.mjs';

const bqTableId = 'leads_own';
const assigned = [
  '109046',
  '88062',
  '79570',
  '112604',
  '50222',
  '110576',
  '66110',
  '103156',
  '46392',
  '128320',
];
const sourceId = 'UC_RQG8O3';

export async function getAndSaveLeadsByCreatedDate(manualDate) {
  const date =
    manualDate ||
    DateTime.now()
      .setZone('Europe/Kyiv')
      .minus({ days: 1 })
      .toFormat('yyyy-MM-dd');
  console.log({
    time: new Date(),
    date,
    message: 'getAndSaveLeadsByCreatedDate',
  });

  const resultByAssigned = await getLeadsByCreateDateAndAssigned({
    date,
    assigned,
  });
  const resultBySourceId = await getLeadsByCreateDateAndSourceId({
    date,
    sourceId,
  });

  console.log({
    getLeadsByCreateDateAndAssigned: resultByAssigned.length,
    getLeadsByCreateDateAndSourceId: resultBySourceId.length,
  });

  if (resultByAssigned.length == 0 && resultBySourceId.length == 0) {
    return;
  }

  const data = [...resultByAssigned, ...resultBySourceId];

  const jsonData = data.map((row) => {
    const { ID, SOURCE_ID, UF_CRM_1688301710585, UF_CRM_1526673568 } = row;
    return {
      id: ID,
      source_id: SOURCE_ID,
      is_duplicate: UF_CRM_1688301710585 == '1' ? true : false,
      city_id: UF_CRM_1526673568,
      date,
    };
  });

  await clearTableByDate({
    bqTableId,
    date,
  });
  const tempFilePath = path.join(os.tmpdir(), 'temp_data.json');
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: leadsTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetLeadsTable({ bqTableId })
  await getAndSaveLeadsByCreatedDate();
}
