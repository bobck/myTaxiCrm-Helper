import { getAssets } from '../../remonline/remonline.utils.mjs';

import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import { createOrResetTableByName, loadRowsViaJSONFile } from '../bq-utils.mjs';
import { assetTableSchema } from '../schemas.mjs';
export async function resetAssetTable() {
  await createOrResetTableByName({
    bqTableId: 'assets',
    schema: assetTableSchema,
    dataSetId: 'RemOnline',
  });
}
const mapAssets=({assets})=>{
  const handledAssets = assets.map((asset) => {
    // const owner_name= asset.owner?.name || asset.owner //reason { id: 29231319, name: '' }
    const owner_name =
      typeof owner === 'string' ? asset.owner : asset.owner?.name;
    // if (typeof owner_name !== 'string') console.log(owner_name);
    const item = { ...asset, owner_name };
    delete item.owner;
    // console.log(item)
    return item;
  });
  return {handledAssets}
}
export async function loadRemonlineAssetsToBQ() {
  const { assets } = await getAssets();
  const {handledAssets} = mapAssets({assets})
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
//   await resetAssetTable();
  await loadRemonlineAssetsToBQ();
}
