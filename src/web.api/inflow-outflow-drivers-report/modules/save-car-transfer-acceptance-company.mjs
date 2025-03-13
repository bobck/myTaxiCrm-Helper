import fs from 'fs';
import path from 'path';
import os from 'os';
import { DateTime } from 'luxon';

import { getCarTransferAcceptanceCompany } from '../../web.api.utlites.mjs';
import { clearTableByDate } from '../../../bq/bq-utils.mjs';
import { carTransferAcceptanceCompanyTableSchema } from '../../../bq/schemas.mjs';
import {
  createOrResetTableByName,
  loadJsonToTable,
} from '../../../bq/bq-utils.mjs';

const bqTableId = 'car_transfer_acceptance_company';

export async function saveCarTransferAcceptanceCompany(manualDate) {
  const date =
    manualDate ||
    DateTime.now()
      .setZone('Europe/Kyiv')
      .minus({ days: 1 })
      .toFormat('yyyy-MM-dd');

  console.log({
    time: new Date(),
    date,
    message: 'saveCarTransferAcceptanceCompany',
  });

  const { rows } = await getCarTransferAcceptanceCompany({ date });

  console.log({
    getCarTransferAcceptanceCompany: rows.length,
  });

  if (rows.length == 0) {
    return;
  }

  const jsonData = rows.map((row) => {
    return {
      ...row,
      date,
    };
  });

  await clearTableByDate({
    bqTableId,
    date,
  });
  const tempFilePath = path.join(
    os.tmpdir(),
    'temp_data_car_transfer_acceptance_company.json'
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: carTransferAcceptanceCompanyTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: carTransferAcceptanceCompanyTableSchema })
  saveCarTransferAcceptanceCompany();
}
