import fs from 'fs';
import path from 'path';
import os from 'os';

import { getSavedManifoldDeals } from '../bitrix.queries.mjs';

import {
  loadJsonToTable,
  clearTable,
  createOrResetTableByName,
} from '../../bq/bq-utils.mjs';

import { manifoldDealsTableSchema } from '../../bq/schemas.mjs';

const bqTableId = 'manifold_deals';

export async function refreshManifoldDeals() {
  console.log({ time: new Date(), message: 'refreshManifoldDeals' });

  const { manifoldDealsIds } = await getSavedManifoldDeals();

  console.log({ getSavedManifoldDeals: manifoldDealsIds.length });

  if (manifoldDealsIds.length == 0) {
    return;
  }

  await clearTable({ bqTableId });
  const tempFilePath = path.join(os.tmpdir(), 'temp_data_manifold_deals.json');
  const jsonString = manifoldDealsIds.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: manifoldDealsTableSchema,
  });

  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: manifoldDealsTableSchema })
  await refreshManifoldDeals();
}
