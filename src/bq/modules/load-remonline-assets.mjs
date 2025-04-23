import { getAssets } from '../../remonline/remonline.utils.mjs';

import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  createOrResetTableByName,
  loadRowsViaJSONFile,
} from '../bq-utils.mjs';
import { assetTableSchema } from '../schemas.mjs';
export async function resetAssetTable() {
  await createOrResetTableByName({
    bqTableId: 'assets',
    schema: assetTableSchema,
    dataSetId: 'RemOnline',
  });
}

export async function loadRemonlineAssetsToBQ() {
  const { assets } = await getAssets();
  const handledAssets = assets.map((asset) => {
    const item = { ...asset, owner_name: asset.owner?.name || asset.owner };
    delete item.owner;
    return item
  });
  const resp = await loadRowsViaJSONFile({
    dataset_id: 'RemOnline',
    table_id: 'assets',
    rows: handledAssets,
    schema: assetTableSchema,
  });
  console.log(resp);
}

if (process.env.ENV === 'TEST') {
  await remonlineTokenToEnv();
  await loadRemonlineAssetsToBQ();
//   await resetAssetTable();
}
